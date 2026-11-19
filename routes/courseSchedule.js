const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Year = require("../models/year");
const Course = require("../models/course");
const CourseSchedule = require("../models/courseSchedule");
const Faculty = require("../models/faculty");
const Signatory = require("../models/signatory");

const wrapAsync = require("../utils/wrapAsync");
const generateWeeks = require("../utils/generateWeeks");
const defaultDailySessions = require("../utils/defaultSessions");

const { generateSchedulePDF } = require("../utils/PDF/courseScheduleGenerator");

async function attachFacultyDetails(schedule) {
  if (!schedule) return schedule;

  const facultyIds = [];

  schedule.weeks.forEach((week) => {
    week.days.forEach((day) => {
      day.sessions.forEach((session) => {
        if (session.faculty && mongoose.isValidObjectId(session.faculty)) {
          facultyIds.push(session.faculty.toString());
        }
      });
    });
  });

  if (facultyIds.length === 0) return schedule;

  const facultyDocs = await Faculty.find({
    _id: { $in: facultyIds },
  }).select("name");

  const facultyMap = new Map(
    facultyDocs.map((faculty) => [faculty._id.toString(), faculty]),
  );

  schedule.weeks.forEach((week) => {
    week.days.forEach((day) => {
      day.sessions.forEach((session) => {
        if (session.faculty && mongoose.isValidObjectId(session.faculty)) {
          session.faculty = facultyMap.get(session.faculty.toString()) || null;
        }
      });
    });
  });

  return schedule;
}

// get course schedule
router.get(
  "/:courseId/schedule",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.send("Course not found");
    const faculties = await Faculty.find().select("name _id").sort({ name: 1 });
    const year = await Year.findOne({ year: course.startDate.getFullYear() });
    const holidays = year ? year.holidays : [];
    let schedule = await CourseSchedule.findOne({
      course: course._id,
    });
    schedule = await attachFacultyDetails(schedule);

    if (!schedule) {
      const weeks = generateWeeks(
        course.startDate,
        course.endDate,
        holidays,
        defaultDailySessions,
      );
      schedule = await CourseSchedule.create({
        course: course._id,
        weeks: weeks,
      });
      schedule = await CourseSchedule.findOne({ course: course._id });
      schedule = await attachFacultyDetails(schedule);
    }
    res.render("schedule/show.ejs", {
      course,
      schedule,
      faculties,
      holidays: holidays || [],
    });
  }),
);

// add a new session in course schedule
router.post(
  "/:courseId/schedule",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const {
      weekIndex,
      dayIndex,
      startTime,
      endTime,
      type,
      title,
      faculty,
      location,
    } = req.body;

    if (
      weekIndex === undefined ||
      dayIndex === undefined ||
      !startTime ||
      !endTime ||
      !type
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    let courseSchedule = await CourseSchedule.findOne({ course: courseId });

    if (!courseSchedule) {
      const course = await Course.findById(courseId);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      const year = await Year.findById(course.year);
      const holidays = year?.holidays || [];
      const weeks = generateWeeks(
        course.startDate,
        course.endDate,
        holidays,
        defaultDailySessions,
      );
      courseSchedule = await CourseSchedule.create({ course: courseId, weeks });
    }

    const week = courseSchedule.weeks[parseInt(weekIndex)];
    if (!week)
      return res
        .status(404)
        .json({ success: false, message: "Week not found" });

    const day = week.days[parseInt(dayIndex)];
    if (!day)
      return res.status(404).json({ success: false, message: "Day not found" });

    const sessionData = { startTime, endTime, type };
    if (title && title.trim()) sessionData.title = title.trim();

    if (faculty && faculty.trim()) {
      if (mongoose.isValidObjectId(faculty)) {
        const facultyExists = await Faculty.findById(faculty);
        if (facultyExists)
          sessionData.faculty = new mongoose.Types.ObjectId(faculty);
      } else {
        sessionData.faculty = faculty.trim();
      }
    }

    if (location && location.trim()) sessionData.location = location.trim();

    day.sessions.push(sessionData);
    await courseSchedule.save();

    // Return the saved subdoc (has _id + populated faculty name if ObjectId)
    const savedSession =
      courseSchedule.weeks[parseInt(weekIndex)].days[
        parseInt(dayIndex)
      ].sessions.slice(-1)[0];

    let facultyOut = savedSession.faculty;
    if (facultyOut && mongoose.isValidObjectId(facultyOut)) {
      const fac = await Faculty.findById(facultyOut).select("name _id");
      facultyOut = fac ? { _id: fac._id, name: fac.name } : null;
    }

    res.status(201).json({
      success: true,
      message: "Session added successfully",
      session: {
        _id: savedSession._id,
        startTime: savedSession.startTime,
        endTime: savedSession.endTime,
        type: savedSession.type,
        title: savedSession.title || "",
        faculty: facultyOut,
        location: savedSession.location || "",
      },
    });
  }),
);

// delete a session from course schedule
router.delete(
  "/:courseId/schedule/session/:sessionId",
  wrapAsync(async (req, res) => {
    const { courseId, sessionId } = req.params;

    const courseSchedule = await CourseSchedule.findOne({
      course: courseId,
    });
    if (!courseSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    let sessionFound = false;

    for (const week of courseSchedule.weeks) {
      for (const day of week.days) {
        const sessionIndex = day.sessions.findIndex(
          (session) => session._id && session._id.toString() === sessionId,
        );
        if (sessionIndex !== -1) {
          day.sessions.splice(sessionIndex, 1);
          sessionFound = true;
          break;
        }
      }
      if (sessionFound) {
        break;
      }
    }

    if (!sessionFound) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    await courseSchedule.save();
    return res.json({
      success: true,
      message: "Session deleted successfully",
    });
  }),
);

// update a session in course schedule
router.put(
  "/:courseId/schedule/session/:sessionId",
  wrapAsync(async (req, res) => {
    const { courseId, sessionId } = req.params;
    const { startTime, endTime, type, title, faculty, location } = req.body;
    const courseSchedule = await CourseSchedule.findOne({
      course: courseId,
    });
    if (!courseSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }
    let sessionFound = false;
    let updatedSession = null;
    for (const week of courseSchedule.weeks) {
      for (const day of week.days) {
        const session = day.sessions.id(sessionId);
        if (session) {
          session.startTime = startTime;
          session.endTime = endTime;
          session.type = type;
          session.title = title?.trim() || undefined;
          if (faculty && faculty.trim()) {
            if (mongoose.isValidObjectId(faculty)) {
              const facultyExists = await Faculty.findById(faculty);

              session.faculty = facultyExists
                ? new mongoose.Types.ObjectId(faculty)
                : undefined;
            } else {
              session.faculty = faculty.trim();
            }
          } else {
            session.faculty = undefined;
          }
          session.location = location?.trim() || undefined;
          updatedSession = session;
          sessionFound = true;
          break;
        }
      }
      if (sessionFound) {
        break;
      }
    }
    if (!sessionFound) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }
    await courseSchedule.save();

    let facultyOut = updatedSession.faculty;
    if (facultyOut && mongoose.isValidObjectId(facultyOut)) {
      const fac = await Faculty.findById(facultyOut).select("name _id");
      facultyOut = fac ? { _id: fac._id, name: fac.name } : null;
    }
    return res.json({
      success: true,
      message: "Session updated successfully",
      session: {
        _id: updatedSession._id,
        startTime: updatedSession.startTime,
        endTime: updatedSession.endTime,
        type: updatedSession.type,
        title: updatedSession.title || "",
        faculty: facultyOut,
        location: updatedSession.location || "",
      },
    });
  }),
);

// download course schedule PDF
router.get(
  "/:courseId/schedule/pdf",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).send("Course not found");
    }
    let schedule = await CourseSchedule.findOne({
      course: courseId,
    });

    if (!schedule) {
      const year = await Year.findById(course.year);
      const holidays = year?.holidays || [];
      const weeks = generateWeeks(
        course.startDate,
        course.endDate,
        holidays,
        defaultDailySessions,
      );
      schedule = await CourseSchedule.create({
        course: course._id,
        weeks,
      });
      schedule = await CourseSchedule.findOne({
        course: courseId,
      });
    }
    schedule = await attachFacultyDetails(schedule);

    const year = await Year.findById(course.year);
    const holidays = year?.holidays || [];
    const signDoc = await Signatory.findOne();
    return generateSchedulePDF(res, course, schedule, holidays, signDoc);
  }),
);

// view course schedule PDF preview
router.get(
  "/:courseId/schedule/preview",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).send("Course not found");
    }
    let schedule = await CourseSchedule.findOne({
      course: courseId,
    });

    if (!schedule) {
      const year = await Year.findById(course.year);
      const holidays = year?.holidays || [];
      const weeks = generateWeeks(
        course.startDate,
        course.endDate,
        holidays,
        defaultDailySessions,
      );
      schedule = await CourseSchedule.create({
        course: course._id,
        weeks,
      });
      schedule = await CourseSchedule.findOne({
        course: courseId,
      });
    }
    schedule = await attachFacultyDetails(schedule);

    const year = await Year.findById(course.year);
    const holidays = year?.holidays || [];
    const signDoc = await Signatory.findOne();

    return generateSchedulePDF(res, course, schedule, holidays, signDoc);
  }),
);

// get doc support for even weeks of course schedule
router.get(
  "/:courseId/schedule/week/:weekIndex/docSupport",
  wrapAsync(async (req, res) => {
    const { courseId, weekIndex } = req.params;

    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found" });
    }

    const week = schedule.weeks[weekIndex];
    if (!week) {
      return res
        .status(404)
        .json({ success: false, message: "Week not found" });
    }

    res.json({
      success: true,
      docSupport1: week.docSupport1 || "",
      docSupport2: week.docSupport2 || "",
    });
  }),
);

// update doc support for even weeks of course schedule
router.put(
  "/:courseId/schedule/week/:weekIndex/docSupport",
  wrapAsync(async (req, res) => {
    const { courseId, weekIndex } = req.params;
    const { docSupport1, docSupport2 } = req.body;

    const schedule = await CourseSchedule.findOne({ course: courseId });
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found" });
    }

    const week = schedule.weeks[weekIndex];
    if (!week) {
      return res
        .status(404)
        .json({ success: false, message: "Week not found" });
    }

    week.docSupport1 =
      typeof docSupport1 === "string" ? docSupport1.trim() : "";
    week.docSupport2 =
      typeof docSupport2 === "string" ? docSupport2.trim() : "";

    await schedule.save();

    res.json({
      success: true,
      message: "Documentation support updated",
      docSupport1: week.docSupport1,
      docSupport2: week.docSupport2,
    });
  }),
);

module.exports = router;
