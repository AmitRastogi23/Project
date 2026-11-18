const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Course = require("../models/course");
const CourseSchedule = require("../models/courseSchedule");
const Faculty = require("../models/faculty");

const wrapAsync = require("../utils/wrapAsync");

const generatePracticalHonorarium = require("../utils/PDF/practicalHonorariumGenerator");
const generateExaminerHonorarium = require("../utils/PDF/examinerHonorariumGenerator");
const generateInvigilatorHonorarium = require("../utils/PDF/invigilatorHonorariumGenerator");
const generateTheoryHonorarium = require("../utils/PDF/theoryHonorariumGenerator");
const generateTravelAllowance = require("../utils/PDF/travelAllowanceGenerator");

router.get("/:courseId/honorarium", (req, res) => {
  const { courseId } = req.params;
  res.render("course/honorarium.ejs", { courseId });
});

router.post(
  "/:courseId/honorarium/practical",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const { name, rank, address } = req.body;

    if (!name || !rank || !address) {
      return res.status(400).send("Name, rank and address are required.");
    }

    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) {
      return res.status(404).send("Course not found");
    }

    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();
    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }

    // ───── Extract all PRACTICAL sessions ─────
    const practicalSessions = [];
    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.type === "PRACTICAL") {
            practicalSessions.push({
              title: (session.title || "Untitled Practical").trim(),
              date: new Date(day.date),
            });
          }
        }
      }
    }

    // ───── Group by title (case-insensitive) ─────
    const groupsMap = new Map();

    for (const s of practicalSessions) {
      const key = s.title.toLowerCase();

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          title: s.title,
          dates: [],
        });
      }
      groupsMap.get(key).dates.push(s.date);
    }

    // ───── Build summary rows ─────
    const summaryRows = [];
    for (const group of groupsMap.values()) {
      group.dates.sort((a, b) => a - b);

      const firstDate = group.dates[0];
      const lastDate = group.dates[group.dates.length - 1];
      const count = group.dates.length;

      summaryRows.push({
        title: group.title,
        count,
        startDate: firstDate,
        endDate: lastDate,
      });
    }

    // Sort groups by earliest start date
    summaryRows.sort((a, b) => a.startDate - b.startDate);

    // ───── Generate PDF ─────
    generatePracticalHonorarium(
      res,
      courseDoc,
      {
        name,
        rank,
        address,
      },
      summaryRows,
    );
  }),
);

router.post(
  "/:courseId/honorarium/examiner",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const { examType, name, rank, address } = req.body;

    if (!examType || !name || !rank || !address) {
      return res
        .status(400)
        .send("Exam type, name, rank and address are required.");
    }

    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) {
      return res.status(404).send("Course not found");
    }

    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();
    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }

    // ───── Find Exam Date from Schedule ─────
    // examType body se "MID-TERM" ya "FINAL-TERM" aayega
    const targetType = examType === "MID-TERM" ? "MID_TERM" : "FINAL_TERM";
    let examDate = null;

    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.type === targetType) {
            examDate = day.date;
            break;
          }
        }
        if (examDate) break;
      }
      if (examDate) break;
    }

    // ───── Generate PDF ─────
    generateExaminerHonorarium(res, courseDoc, examDate, examType, {
      name,
      rank,
      address,
    });
  }),
);

router.post(
  "/:courseId/honorarium/invigilator",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const { examType, name, rank, address } = req.body;

    if (!examType || !name || !rank || !address) {
      return res
        .status(400)
        .send("Exam type, name, rank and address are required.");
    }

    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) {
      return res.status(404).send("Course not found");
    }

    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();
    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }

    // ───── Find Exam Date from Schedule ─────
    const targetType = examType === "MID-TERM" ? "MID_TERM" : "FINAL_TERM";
    let examDate = null;

    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.type === targetType) {
            examDate = day.date;
            break;
          }
        }
        if (examDate) break;
      }
      if (examDate) break;
    }

    // ───── Generate PDF ─────
    generateInvigilatorHonorarium(res, courseDoc, examDate, examType, {
      name,
      rank,
      address,
    });
  }),
);

// Route to get grouped theory lectures for dropdown
router.get(
  "/:courseId/honorarium/get-theory-lectures",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;

    const schedule = await CourseSchedule.findOne({ course: courseId }).lean();
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found" });
    }

    const facultyIds = new Set();
    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (
            session.type === "THEORY" &&
            session.faculty &&
            mongoose.isValidObjectId(session.faculty)
          ) {
            facultyIds.add(session.faculty.toString());
          }
        }
      }
    }

    let facultyMap = new Map();
    if (facultyIds.size > 0) {
      const facDocs = await Faculty.find({
        _id: { $in: [...facultyIds] },
      }).lean();
      facDocs.forEach((f) => facultyMap.set(f._id.toString(), f));
    }

    const grouped = new Map();

    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.type !== "THEORY") continue;

          const originalTitle =
            (session.title || "").trim() || "Untitled Lecture";
          const normalizedTitle =
            originalTitle
              .replace(/\d+/g, "")
              .replace(/[-/\\:]+/g, " ")
              .replace(/\s+/g, " ")
              .trim() || "Untitled Lecture";

          const facultyId =
            session.faculty && mongoose.isValidObjectId(session.faculty)
              ? session.faculty.toString()
              : String(session.faculty || "");

          // Date string nikalna for grouping
          const dateStr = day.date
            ? new Date(day.date).toISOString().split("T")[0]
            : "unknown";

          const key = `${normalizedTitle.toLowerCase()}||${facultyId}||${dateStr}`;

          if (!grouped.has(key)) {
            const facData = facultyMap.get(facultyId) || {};
            const facName =
              facData.name || (facultyId ? "Guest Faculty" : "Guest");
            const facRank = facData.rank || "";
            const facAddress = facData.address || "";

            // Date format DD/MM/YYYY for display
            let displayDate = "";
            if (day.date) {
              const d = new Date(day.date);
              displayDate = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
            }

            grouped.set(key, {
              title: normalizedTitle,
              facultyId: facultyId,
              name: facName,
              rank: facRank,
              address: facAddress,
              count: 0,
              date: day.date,
              displayDate: displayDate,
            });
          }

          const item = grouped.get(key);
          item.count += 1;
          item.format = `${item.title} by ${item.name} (${String(item.count).padStart(2, "0")} session${item.count > 1 ? "s" : ""} - ${item.displayDate})`;
        }
      }
    }

    const lecturesList = Array.from(grouped.values());
    res.json({ success: true, lectures: lecturesList });
  }),
);

// ═════════ POST: Generate Theory PDF ═════════
router.post(
  "/:courseId/honorarium/theory",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const { title, name, rank, address, sessions, date } = req.body;

    // Basic validation
    if (!title || !name || !rank || !address || !sessions) {
      return res.status(400).send("Missing required fields.");
    }

    // Date validation (frontend se ISO string aayegi)
    let finalDate = date;
    if (!finalDate || isNaN(new Date(finalDate).getTime())) {
      return res.status(400).send("Invalid or missing date selected.");
    }

    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) {
      return res.status(404).send("Course not found");
    }

    // Direct PDF function ko data bhej do
    generateTheoryHonorarium(res, courseDoc, {
      title,
      name,
      rank,
      address,
      sessions: Number(sessions),
      date: finalDate, // Valid date pass kar di
    });
  }),
);

// ═════════ POST: Generate Travel Allowance PDF ═════════
router.post(
  "/:courseId/honorarium/travel",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const { visitType, name, rank, address, distance, lectureTitle } = req.body;

    // 1. Strict Validation (Security & Data Integrity)
    const validVisitTypes = ["practical", "theory", "final", "mid"];
    if (!validVisitTypes.includes(visitType)) {
      return res.status(400).send("Invalid visit type.");
    }

    if (
      !name ||
      typeof name !== "string" ||
      name.trim() === "" ||
      !rank ||
      typeof rank !== "string" ||
      rank.trim() === "" ||
      !address ||
      typeof address !== "string" ||
      address.trim() === ""
    ) {
      return res.status(400).send("Name, rank, and address are required.");
    }

    const distNum = Number(distance);
    if (isNaN(distNum) || distNum <= 0) {
      return res.status(400).send("Distance must be a valid positive number.");
    }

    // Agar theory hai, toh lectureTitle compulsory hai
    if (
      visitType === "theory" &&
      (!lectureTitle ||
        typeof lectureTitle !== "string" ||
        lectureTitle.trim() === "")
    ) {
      return res
        .status(400)
        .send("Lecture title is required for Theory classes.");
    }

    // 2. Fetch Course
    const courseDoc = await Course.findById(courseId).populate("year");
    if (!courseDoc) {
      return res.status(404).send("Course not found.");
    }

    // 3. Calculate Amount (14 Rs per km)
    const ratePerKm = 14;
    const totalAmount = distNum * ratePerKm;

    // 4. Generate PDF
    generateTravelAllowance(res, courseDoc, {
      visitType,
      name: name.trim(),
      rank: rank.trim(),
      address: address.trim(),
      distance: distNum,
      lectureTitle: lectureTitle ? lectureTitle.trim() : "",
      ratePerKm,
      totalAmount,
    });
  }),
);

module.exports = router;
