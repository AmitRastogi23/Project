const express = require("express");
const router = express.Router();

// ── Models ──
const Course = require("../models/course");
const CourseSchedule = require("../models/courseSchedule");
const Signatory = require("../models/signatory");
const Enrollment = require("../models/enrollment");

// ── Utils ──
const wrapAsync = require("../utils/wrapAsync");

// ── PDF Generators ──
const generatePracticalION = require("../utils/PDF/practicalION");
const generateExternalExaminer = require("../utils/PDF/externalExaminerGenerator");
const generateInternalInvigilator = require("../utils/PDF/internalInvigilatorGenerator");
const generateInstructionalVisitION = require("../utils/PDF/instructionalVisitIONGenerator");
const generateTheoryLectures = require("../utils/PDF/theoryLecturesGenerator");
const generateGuestFacultyInvite = require("../utils/PDF/guestFacultyInviteGenerator");

router.get("/:courseId/notice", (req, res) => {
  const { courseId } = req.params;
  res.render("course/notice.ejs", { courseId });
});

router.get(
  "/:courseId/practicalION",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const courseDoc = await Course.findById(courseId).populate("year");

    if (!courseDoc) {
      return res.status(404).send("Course not found");
    }

    const participantCount = await Enrollment.countDocuments({
      courseId: courseId,
    });

    const signDoc = await Signatory.findOne({});

    generatePracticalION(res, courseDoc, participantCount, signDoc);
  }),
);

router.get(
  "/:courseId/exam-dates",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();

    if (!schedule) {
      return res
        .status(404)
        .json({ error: "Schedule not found for this course" });
    }

    const toYMD = (d) => {
      const dt = new Date(d);
      const yyyy = dt.getUTCFullYear();
      const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(dt.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    let midTermDate = null;
    let finalTermDate = null;

    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.type === "MID_TERM" && !midTermDate) {
            midTermDate = day.date;
          }
          if (session.type === "FINAL_TERM" && !finalTermDate) {
            finalTermDate = day.date;
          }
        }
      }
      if (midTermDate && finalTermDate) break;
    }

    return res.json({
      midTermDate: midTermDate ? toYMD(midTermDate) : null,
      finalTermDate: finalTermDate ? toYMD(finalTermDate) : null,
    });
  }),
);

router.get(
  "/:courseId/instructional-visits",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;

    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const visits = [];

    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.type === "INSTRUCTIONAL_VISIT") {
            visits.push({
              _id: session._id,
              title: session.title || "Instructional Visit",
              location: session.location || "—",
              date: day.date,
              day: day.day,
              weekNumber: week.weekNumber,
              startTime: session.startTime,
              endTime: session.endTime,
            });
          }
        }
      }
    }

    // Sort by date
    visits.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.json({ visits });
  }),
);

router.post(
  "/:courseId/external-examiner",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;

    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) {
      return res.status(404).send("Course not found");
    }

    const {
      address,
      examType, // "MID-TERM" | "FINAL-TERM"
      marks,
      date, // yyyy-mm-dd
      startTime, // "10:00"
      endTime, // "13:00"
    } = req.body;

    const signDoc = await Signatory.findOne({});

    generateExternalExaminer(
      res,
      courseDoc,
      { address, examType, marks, date, startTime, endTime },
      signDoc,
    );
  }),
);

router.post(
  "/:courseId/internal-invigilator",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) return res.status(404).send("Course not found");

    const signDoc = await Signatory.findOne({});

    generateInternalInvigilator(res, courseDoc, req.body, signDoc);
  }),
);

router.get(
  "/:courseId/instructional-visit/:sessionId/ion",
  wrapAsync(async (req, res) => {
    const { courseId, sessionId } = req.params;

    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) {
      return res.status(404).send("Course not found");
    }

    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();
    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }

    // Session dhoondho schedule me
    let visit = null;
    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (
            session._id &&
            session._id.toString() === sessionId &&
            session.type === "INSTRUCTIONAL_VISIT"
          ) {
            visit = {
              ...session,
              date: day.date,
              day: day.day,
              weekNumber: week.weekNumber,
            };
            break;
          }
        }
        if (visit) break;
      }
      if (visit) break;
    }

    if (!visit) {
      return res.status(404).send("Instructional visit not found");
    }

    const signDoc = await Signatory.findOne({});
    const participantCount = await Enrollment.countDocuments({
      courseId: courseId,
    });

    generateInstructionalVisitION(
      res,
      courseDoc,
      visit,
      signDoc,
      participantCount,
      2,
    );
  }),
);

router.get(
  "/:courseId/theory-lectures/pdf",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) {
      return res.status(404).send("Course not found");
    }
    const schedule = await CourseSchedule.findOne({
      course: courseId,
    }).lean(); // 👈 populate hatao
    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }
    const signDoc = await Signatory.findOne({});
    await generateTheoryLectures(res, courseDoc, schedule, signDoc);
  }),
);

router.get(
  "/:courseId/guest-faculty-lectures",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;

    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();
    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const raw = [];

    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          const f = session.faculty;

          if (
            typeof f === "string" &&
            f.trim().toLowerCase().startsWith("guest faculty")
          ) {
            raw.push({
              _id: session._id,
              faculty: f.trim(),
              type: session.type,
              title: session.title || "—",
              location: session.location || "—",
              date: day.date,
              day: day.day,
              weekNumber: week.weekNumber,
              startTime: session.startTime,
              endTime: session.endTime,
            });
          }
        }
      }
    }

    const groupsMap = new Map();

    for (const l of raw) {
      const dateKey = new Date(l.date).toISOString().split("T")[0];
      const key = `${dateKey}||${l.faculty.toLowerCase()}`;

      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key).push(l);
    }

    const lectures = [];

    for (const group of groupsMap.values()) {
      group.sort((a, b) => a.startTime.localeCompare(b.startTime));

      const first = group[0];
      const last = group[group.length - 1];

      lectures.push({
        _id: first._id,
        sessionIds: group.map((g) => g._id),
        faculty: first.faculty,
        type: first.type,
        title: first.title,
        location: first.location,
        date: first.date,
        day: first.day,
        weekNumber: first.weekNumber,
        startTime: first.startTime, // earliest
        endTime: last.endTime, // latest
      });
    }

    lectures.sort((a, b) => {
      const d = new Date(a.date) - new Date(b.date);
      if (d !== 0) return d;
      return a.startTime.localeCompare(b.startTime);
    });

    return res.json({ lectures });
  }),
);

router.post(
  "/:courseId/guest-faculty/:sessionId/invite",
  wrapAsync(async (req, res) => {
    const { courseId, sessionId } = req.params;
    const { address, sessionIds } = req.body;

    if (!address || !address.trim()) {
      return res.status(400).send("Address is required");
    }

    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) {
      return res.status(404).send("Course not found");
    }

    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();
    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }

    const ids =
      Array.isArray(sessionIds) && sessionIds.length
        ? sessionIds.map(String)
        : [sessionId];

    const group = [];
    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session._id && ids.includes(session._id.toString())) {
            group.push({
              ...session,
              date: day.date,
              day: day.day,
              weekNumber: week.weekNumber,
            });
          }
        }
      }
    }

    if (group.length === 0) {
      return res.status(404).send("Lecture not found");
    }

    // Sort by startTime → merge first start + last end
    group.sort((a, b) => a.startTime.localeCompare(b.startTime));

    const first = group[0];
    const last = group[group.length - 1];

    const lecture = {
      ...first,
      date: first.date,
      day: first.day,
      weekNumber: first.weekNumber,
      startTime: first.startTime,
      endTime: last.endTime,
      sessionIds: group.map((g) => g._id),
    };

    const signDoc = await Signatory.findOne({});

    generateGuestFacultyInvite(
      res,
      courseDoc,
      lecture,
      address.trim(),
      signDoc,
    );
  }),
);

module.exports = router;
