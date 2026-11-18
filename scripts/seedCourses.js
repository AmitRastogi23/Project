const mongoose = require("mongoose");
const Course = require("../models/course");

// ================= HELPERS =================

// IST local date ke Y-M-D nikalta hai (jo user/website dekhta hai)
// Server agar IST me hai, to new Date().getDate() IST dega.
// Safe rehne ke liye hum IST offset explicitly use kar rahe hain.
function ymdIST(date) {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const shifted = new Date(new Date(date).getTime() + IST_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

// UTC noon wala Date banata hai
function utcNoon(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

// Weekday check — sirf verify ke liye (Monday=1, Friday=5 in UTC after noon shift)
function weekdayName(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(date).getUTCDay()];
}

// ================= FIX =================
async function fixCourseDates() {
  console.log("==========================================");
  console.log("FIX: Course dates → same Y-M-D as website (IST)");
  console.log("==========================================\n");

  await mongoose.connect("mongodb://127.0.0.1:27017/SDC");
  console.log("✅ Connected to MongoDB (SDC)\n");

  const courses = await Course.find().sort({ courseNumber: 1 });
  console.log(`📊 Found ${courses.length} courses\n`);

  let hasWarning = false;

  for (const course of courses) {
    const oldStartISO = course.startDate.toISOString();
    const oldEndISO = course.endDate.toISOString();

    // 1. What the website currently SHOWS (IST view)
    const s = ymdIST(course.startDate);
    const e = ymdIST(course.endDate);

    // 2. Rebuild as UTC noon (DB stores it in a shift-proof way)
    const newStart = utcNoon(s.y, s.m, s.d);
    const newEnd = utcNoon(e.y, e.m, e.d);

    // 3. Verify weekday pattern
    const sDay = weekdayName(newStart);
    const eDay = weekdayName(newEnd);
    const sOk = sDay === "Mon";
    const eOk = eDay === "Fri";
    if (!sOk || !eOk) hasWarning = true;

    course.startDate = newStart;
    course.endDate = newEnd;
    await course.save();

    console.log(
      `✅ Course ${course.courseNumber} [${course.courseName}]\n` +
        `   start: ${oldStartISO}  →  ${newStart.toISOString()}   (${sDay}${sOk ? "" : " ⚠️"})\n` +
        `   end:   ${oldEndISO}  →  ${newEnd.toISOString()}   (${eDay}${eOk ? "" : " ⚠️"})`,
    );
  }

  if (hasWarning) {
    console.log(
      "\n⚠️  Some courses don't start on Monday or end on Friday. Check above.",
    );
  } else {
    console.log(
      "\n🎉 All courses fixed. Every start is Monday, every end is Friday.",
    );
  }

  console.log("⚠️  CourseSchedule, Year, Applicant, Enrollment — UNTOUCHED\n");

  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed");
}

fixCourseDates().catch(async (err) => {
  console.error("\n❌ FIX ERROR:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
