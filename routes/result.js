const express = require("express");
const router = express.Router();

const Course = require("../models/course");
const Result = require("../models/result");
const Enrollment = require("../models/enrollment");

const wrapAsync = require("../utils/wrapAsync");

const generateConductExaminer = require("../utils/PDF/conductExaminerGenerator");
const generateConductMarks = require("../utils/PDF/conductMarksGenerator");

// Render Result Page
router.get(
  "/:courseId/result",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("year");
    if (!course) return res.status(404).send("Course not found");

    const enrollments = await Enrollment.find({ courseId })
      .populate("applicantId")
      .sort({ "applicantId.name": 1 });

    const results = await Result.find({ courseId });

    res.render("result/show.ejs", { course, enrollments, results });
  }),
);

router.patch(
  "/:courseId/result/practical-config",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const { term, examinerName, invigilatorName, subjects } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (!course.practicalConfig) {
      course.practicalConfig = { midTerm: {}, finalTerm: {} };
    }

    if (term === "midTerm") {
      course.practicalConfig.midTerm = {
        examinerName: examinerName || "",
        invigilatorName: invigilatorName || "",
        subjects: subjects || [],
      };
    } else if (term === "finalTerm") {
      course.practicalConfig.finalTerm = {
        examinerName: examinerName || "",
        invigilatorName: invigilatorName || "",
        subjects: subjects || [],
      };
    } else {
      return res.status(400).json({ success: false, message: "Invalid term" });
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: "Practical configuration saved successfully",
      data: course.practicalConfig,
    });
  }),
);

// Update Conduct Config (Max, Min, Evaluators)
router.patch(
  "/:courseId/result/conduct-config",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const { maxMarks, minMarks, evaluators } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    course.conductConfig.maxMarks =
      maxMarks !== undefined ? Number(maxMarks) : 15;
    course.conductConfig.minMarks =
      minMarks !== undefined ? Number(minMarks) : 9;

    if (Array.isArray(evaluators) && evaluators.length === 3) {
      course.conductConfig.evaluators = evaluators;
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: "Conduct configuration saved successfully",
      data: course.conductConfig,
    });
  }),
);

// Save Conduct Marks for Evaluators
router.patch(
  "/:courseId/result/conduct-marks",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const { marksData } = req.body;

    if (!Array.isArray(marksData)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid data format" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const maxAllowed = course.conductConfig?.maxMarks || 15;
    const bulkOps = [];

    for (const data of marksData) {
      const marksArr = [];

      const addMark = (key, val) => {
        if (val !== null && val !== "" && val !== undefined) {
          const num = Number(val);
          if (num < 0 || num > maxAllowed) {
            throw new Error(
              `Invalid marks entered. Must be between 0 and ${maxAllowed}.`,
            );
          }
          marksArr.push({ evaluatorKey: key, marks: num });
        }
      };

      try {
        addMark("eval_1", data.eval_1);
        addMark("eval_2", data.eval_2);
        addMark("eval_3", data.eval_3);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      let average = null;
      if (marksArr.length > 0) {
        const sum = marksArr.reduce((a, b) => a + b.marks, 0);
        average = Math.round((sum / marksArr.length) * 100) / 100;
      }

      bulkOps.push({
        updateOne: {
          filter: { courseId: courseId, enrollmentId: data.enrollmentId },
          update: {
            $set: {
              "conductKeenness.marks": marksArr,
              "conductKeenness.average": average,
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await Result.bulkWrite(bulkOps);
    }

    res
      .status(200)
      .json({ success: true, message: "Conduct marks saved successfully" });
  }),
);

// Download Examiner Sheet
router.get(
  "/:courseId/result/conduct/examiner-sheet",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send("Course not found");

    const enrollments = await Enrollment.find({ courseId })
      .populate("applicantId")
      .sort({ "applicantId.name": 1 });

    generateConductExaminer(res, course, enrollments);
  }),
);

// Download Marks Sheet (With Data)
router.get(
  "/:courseId/result/conduct/marks-sheet",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send("Course not found");

    const enrollments = await Enrollment.find({ courseId })
      .populate("applicantId")
      .sort({ "applicantId.name": 1 });

    const results = await Result.find({ courseId });

    generateConductMarks(res, course, enrollments, results);
  }),
);

module.exports = router;
