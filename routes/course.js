const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Year = require("../models/year");
const Course = require("../models/course");
const CourseSchedule = require("../models/courseSchedule");
const Enrollment = require("../models/enrollment");

const wrapAsync = require("../utils/wrapAsync");
const defaultDailySessions = require("../utils/defaultSessions");
const generateWeeks = require("../utils/generateWeeks");

// 1. Directly select course to view applicant route
router.get("/", (req, res) => {
  res.render("course/search.ejs");
});

// 2. Get Course Details (Populated with Year for Edit Modal)
router.get(
  "/details",
  wrapAsync(async (req, res) => {
    const { courseNumber, courseName } = req.query;
    // populate("year") zaroori hai edit modal ke liye
    let courseDoc = await Course.find({
      courseNumber: courseNumber,
      courseName: courseName,
    }).populate("year");

    if (courseDoc.length == 0) {
      return res.send("No Such Course Found!!");
    } else {
      courseDoc = courseDoc[0];
      res.render("course/show.ejs", { courseDoc });
    }
  }),
);

// 3. Adding new course route (GET)
router.get("/new", (req, res) => {
  res.render("course/new.ejs");
});

// 4. Adding new course route (POST)
router.post(
  "/",
  wrapAsync(async (req, res) => {
    let {
      year,
      courseNumber,
      courseName,
      otherCourseName,
      startDate,
      endDate,
    } = req.body;

    // Others handle
    if (courseName === "Others" && otherCourseName) {
      courseName = otherCourseName.trim();
    }

    // Validation
    if (!year || !courseNumber || !courseName || !startDate || !endDate) {
      return res.status(400).send("All fields are required.");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res
        .status(400)
        .send("End date must be strictly after start date.");
    }

    if (start.getFullYear() !== Number(year)) {
      return res
        .status(400)
        .send(
          `Start date must be within the selected training year (${year}).`,
        );
    }

    // Unique Check
    const existingCourse = await Course.findOne({
      courseNumber: Number(courseNumber),
      courseName: courseName,
    });
    if (existingCourse) {
      return res
        .status(400)
        .send("Course number and name combination already exists.");
    }

    // Year Check / Fetch
    let yearDoc = await Year.findOne({ year: Number(year) });
    if (!yearDoc) {
      yearDoc = await Year.create({ year: Number(year) });
    }

    // 1. Create Course
    const course = await Course.create({
      year: yearDoc._id,
      courseNumber: Number(courseNumber),
      courseName,
      startDate: start,
      endDate: end,
    });

    yearDoc.courses.push(course._id);
    await yearDoc.save();

    // 2. Automatically Generate & Save CourseSchedule with Default Sessions
    const holidays = yearDoc.holidays || [];
    const weeks = generateWeeks(start, end, holidays, defaultDailySessions);

    await CourseSchedule.create({
      course: course._id,
      weeks: weeks,
    });

    res.send("Course added successfully with default schedule.");
  }),
);

// 5. EDIT (PATCH) ROUTE
router.patch(
  "/:courseId",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    let {
      year,
      courseNumber,
      courseName,
      otherCourseName,
      startDate,
      endDate,
    } = req.body;

    if (courseName === "Others" && otherCourseName) {
      courseName = otherCourseName.trim();
    }

    if (!year || !courseNumber || !courseName || !startDate || !endDate) {
      return res.status(400).send("All fields are required.");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res
        .status(400)
        .send("End date must be strictly after start date.");
    }

    if (start.getFullYear() !== Number(year)) {
      return res
        .status(400)
        .send(
          `Start date must be within the selected training year (${year}).`,
        );
    }

    const currentCourse = await Course.findById(courseId);
    if (!currentCourse) {
      return res.status(404).send("Course not found.");
    }

    // Check for duplicate number + name
    const duplicateCheck = await Course.findOne({
      _id: { $ne: courseId },
      courseNumber: Number(courseNumber),
      courseName: courseName,
    });

    if (duplicateCheck) {
      return res
        .status(400)
        .send("Course number and name combination already exists.");
    }

    // Check if major changes occurred (Year/Date)
    const isDateChanged =
      currentCourse.startDate.getTime() !== start.getTime() ||
      currentCourse.endDate.getTime() !== end.getTime();
    const isYearChanged = currentCourse.year.toString() !== year.toString();

    // Agar major changes nahi hue, toh simple update
    if (!isDateChanged && !isYearChanged) {
      await Course.findByIdAndUpdate(
        courseId,
        { courseNumber: Number(courseNumber), courseName },
        { new: true, runValidators: true },
      );
      return res.send(
        "Course details updated successfully without major changes.",
      );
    }

    // Agar major changes hue (Dates or Year) - Toh bina transaction ke manually handle karo
    try {
      // 1. Purane Year document se courseId hatao
      const oldYearDoc = await Year.findById(currentCourse.year);
      if (oldYearDoc) {
        oldYearDoc.courses.pull(currentCourse._id);
        await oldYearDoc.save();
      }

      // 2. Purana Schedule delete karo
      await CourseSchedule.findOneAndDelete({ course: courseId });

      // 3. Saare purane Enrollments delete karo
      await Enrollment.deleteMany({ courseId: courseId });

      // 4. Naya Year dhoondho ya banao
      let newYearDoc = await Year.findOne({ year: Number(year) });
      if (!newYearDoc) {
        newYearDoc = await Year.create({ year: Number(year) });
      }

      // 5. Course document update karo
      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        {
          year: newYearDoc._id,
          courseNumber: Number(courseNumber),
          courseName,
          startDate: start,
          endDate: end,
        },
        { new: true, runValidators: true },
      );

      // 6. Naye Year document mein courseId push karo
      newYearDoc.courses.push(updatedCourse._id);
      await newYearDoc.save();

      // 7. Naya default schedule banao
      const holidays = newYearDoc.holidays || [];
      const weeks = generateWeeks(start, end, holidays, defaultDailySessions);
      await CourseSchedule.create({ course: updatedCourse._id, weeks });

      res.send(
        "Course updated successfully. Old schedule and enrollments deleted, new schedule generated.",
      );
    } catch (err) {
      console.error("Update Course Error:", err);
      res
        .status(500)
        .send("An error occurred while updating the course. Please try again.");
    }
  }),
);

// 6. DELETE ROUTE
router.delete(
  "/:courseId",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).send("Course not found.");
    }

    try {
      // 1. Year document se courseId hatao
      const yearDoc = await Year.findById(course.year);
      if (yearDoc) {
        yearDoc.courses.pull(course._id);
        await yearDoc.save();
      }

      // 2. Schedule delete karo
      await CourseSchedule.findOneAndDelete({ course: courseId });

      // 3. Enrollments delete karo
      await Enrollment.deleteMany({ courseId: courseId });

      // 4. Course document delete karo
      await Course.findByIdAndDelete(courseId);

      res.send(
        "Course, schedule, and all related enrollments deleted successfully.",
      );
    } catch (err) {
      console.error("Delete Course Error:", err);
      res
        .status(500)
        .send("An error occurred while deleting the course. Please try again.");
    }
  }),
);

module.exports = router;
