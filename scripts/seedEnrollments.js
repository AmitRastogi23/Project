const mongoose = require("mongoose");
const Applicant = require("../models/applicant");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");

// ================= SAFE DATE HELPERS (no UTC shift) =================
function utcDate(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

function addDaysUTC(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function ymdOf(date) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return { y, m, d: dd };
}

// Rebuild a date at UTC midnight using the SAME Y-M-D
function preserveYMD(date) {
  const { y, m, d } = ymdOf(date);
  return utcDate(parseInt(y), parseInt(m), parseInt(d));
}

// ================= HELPERS =================
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ================= SEED =================
async function seedEnrollments() {
  console.log("==========================================");
  console.log("SEED: ENROLLMENTS ONLY");
  console.log("==========================================\n");

  await mongoose.connect("mongodb://127.0.0.1:27017/SDC");
  console.log("✅ Connected to MongoDB (SDC)\n");

  const applicants = await Applicant.find();
  const courses = await Course.find();

  console.log(`📊 Applicants in DB: ${applicants.length}`);
  console.log(`📊 Courses in DB:    ${courses.length}\n`);

  if (applicants.length === 0) {
    console.log("❌ No applicants found. Run seedApplicants first.");
    await mongoose.connection.close();
    return;
  }
  if (courses.length === 0) {
    console.log("❌ No courses found. Seed courses first.");
    await mongoose.connection.close();
    return;
  }

  const before = await Enrollment.countDocuments();
  const del = await Enrollment.deleteMany({});
  console.log(`🧹 Deleted enrollments: ${del.deletedCount} (was ${before})\n`);

  const allEnrollments = [];

  for (const course of courses) {
    const startUTC = preserveYMD(course.startDate);

    const cohortSize = randomInt(22, 32);
    const shuffled = [...applicants]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(cohortSize, applicants.length));

    shuffled.forEach((applicant, idx) => {
      // 30% report a day earlier, else on start date
      const reportingDate =
        Math.random() < 0.3 ? addDaysUTC(startUTC, -1) : startUTC;

      // MO date: always 1 or 2 days BEFORE reporting date
      const MODate = addDaysUTC(reportingDate, -randomInt(1, 2));

      allEnrollments.push({
        applicantId: applicant._id,
        courseId: course._id,
        reportingDate,
        noonTime: Math.random() < 0.7 ? "ForeNoon" : "AfterNoon",
        MONumber: `MO/${startUTC.getUTCFullYear()}/TRG/${course.courseNumber}/${String(
          idx + 1,
        ).padStart(3, "0")}`,
        MODate,
        itemsReceived: {
          courseKit: Math.random() < 0.92,
          studyMaterial: Math.random() < 0.95,
          photograph: Math.random() < 0.88,
        },
        documentsReceived: {
          movementOrder: true,
          resServiceCertificate: Math.random() < 0.85,
          medCertificate: Math.random() < 0.94,
          qualificationDocuments: Math.random() < 0.88,
          prevCourseCertificate: Math.random() < 0.78,
          passportPhoto: Math.random() < 0.92,
        },
        leaves: [],
        totalLeaves: 0,
        totalMarks: 10,
        SOS: null,
        SOSReason: null,
      });
    });

    const s = ymdOf(startUTC);
    console.log(
      `  📁 Course ${course.courseNumber} [${course.courseName}] start=${s.y}-${s.m}-${s.d} → ${shuffled.length} enrolled`,
    );
  }

  const inserted = await Enrollment.insertMany(allEnrollments);
  console.log(`\n✅ Inserted ${inserted.length} enrollments total\n`);

  console.log("🔍 Spot-check (first 3):");
  const sample = await Enrollment.find().limit(3).lean();
  sample.forEach((e) => {
    const r = ymdOf(e.reportingDate);
    const m = ymdOf(e.MODate);
    console.log(
      `  reportingDate: ${r.y}-${r.m}-${r.d}  MODate: ${m.y}-${m.m}-${m.d}  leaves: ${e.leaves.length}  SOS: ${e.SOS}`,
    );
  });

  console.log("\n🎉 Enrollment seed complete!");
  console.log(
    "⚠️  Applicant, Course, CourseSchedule, Year, Faculty — UNTOUCHED\n",
  );

  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed");
}

seedEnrollments().catch(async (err) => {
  console.error("\n❌ SEED ERROR:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
