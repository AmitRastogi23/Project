const mongoose = require("mongoose");
const Year = require("../models/year");
const Course = require("../models/course");
const Applicant = require("../models/applicant");
const Enrollment = require("../models/enrollment");
const CourseSchedule = require("../models/courseSchedule");
const generateWeeks = require("../utils/generateWeeks");

// Indian first names & surnames for realistic DRDO/Defense personnel
const firstNames = [
  "Amit",
  "Rohit",
  "Rajesh",
  "Suresh",
  "Ramesh",
  "Vikrant",
  "Sunil",
  "Anil",
  "Deepak",
  "Sandeep",
  "Manoj",
  "Ajay",
  "Vijay",
  "Sanjay",
  "Pradeep",
  "Alok",
  "Arvind",
  "Dinesh",
  "Rakesh",
  "Manish",
  "Gaurav",
  "Saurabh",
  "Rahul",
  "Varun",
  "Abhishek",
  "Pankaj",
  "Sachin",
  "Nitin",
  "Ankit",
  "Vishal",
  "Vivek",
  "Ashok",
  "Kuldeep",
  "Jitendra",
  "Dharmendra",
  "Harish",
  "Hemant",
  "Mahesh",
  "Mukesh",
  "Praveen",
];

const surnames = [
  "Sharma",
  "Verma",
  "Singh",
  "Kumar",
  "Yadav",
  "Rastogi",
  "Gupta",
  "Patel",
  "Mishra",
  "Chauhan",
  "Joshi",
  "Tiwari",
  "Pandey",
  "Bhatia",
  "Rawat",
  "Nair",
  "Menon",
  "Reddy",
  "Das",
  "Roy",
  "Malik",
  "Choudhary",
  "Tomar",
  "Saxena",
  "Kapoor",
  "Dubey",
  "Shukla",
  "Bhardwaj",
  "Tripathi",
  "Goswami",
];

const departments = [
  "Indian Army",
  "Indian Air Force",
  "Indian Navy",
  "Indian Coast Guard",
  "CFEES, DRDO",
  "LRDE, DRDO",
  "DMSRDE, DRDO",
  "DRDO HQ",
  "DRONA",
];

const ranks = [
  "Captain",
  "Major",
  "Lieutenant",
  "Colonel",
  "Subedar",
  "Naib Subedar",
  "Havildar",
  "Commander",
  "Lieutenant Commander",
  "Squadron Leader",
  "Wing Commander",
  "Flight Lieutenant",
  "Leading Fireman",
  "Station Officer",
  "Sub-Officer",
];

const militaryUnits = [
  "CFEES SDC, Pilkhuwa",
  "23 Armoured Regiment, Ambala",
  "Air Force Station, Hindon",
  "INS Hansa, Goa",
  "HQ Western Command, Chandimandir",
  "501 Field Maintenance Station, Pathankot",
  "Naval Dockyard, Mumbai",
  "DRDO Complex, Timarpur, Delhi",
  "14 Corps Signal Regiment, Leh",
  "Air Force Academy, Dundigal, Hyderabad",
  "INS Shivaji, Lonavala",
  "Coast Guard Station, Chennai",
  "12 Para (SF), Agra",
  "DRDO SASE, Chandigarh",
];

// Helper functions
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min, max) => {
  if (min > max) return max;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Returns the Nth Monday of a given month (0-indexed month)
function getMondayOfMonth(year, month, weekIndex) {
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday
  const daysUntilMonday = (1 - dayOfWeek + 7) % 7;
  const firstMondayDate = 1 + daysUntilMonday;
  const targetDate = firstMondayDate + weekIndex * 7;
  return new Date(year, month, targetDate);
}

// Generate realistic gazetted holidays for a specific year
function getHolidaysForYear(year) {
  return [
    { date: new Date(year, 0, 26), Occasion: "Republic Day" },
    { date: new Date(year, 2, 8), Occasion: "Maha Shivratri" },
    { date: new Date(year, 2, 25), Occasion: "Holi" },
    { date: new Date(year, 2, 29), Occasion: "Good Friday" },
    { date: new Date(year, 3, 11), Occasion: "Id-ul-Fitr" },
    { date: new Date(year, 3, 21), Occasion: "Mahavir Jayanti" },
    { date: new Date(year, 4, 23), Occasion: "Buddha Purnima" },
    { date: new Date(year, 5, 17), Occasion: "Id-ul-Zuha (Bakrid)" },
    { date: new Date(year, 6, 17), Occasion: "Muharram" },
    { date: new Date(year, 7, 15), Occasion: "Independence Day" },
    { date: new Date(year, 7, 26), Occasion: "Janmashtami" },
    { date: new Date(year, 8, 16), Occasion: "Milad-un-Nabi" },
    { date: new Date(year, 9, 2), Occasion: "Mahatma Gandhi Birthday" },
    { date: new Date(year, 9, 12), Occasion: "Dussehra (Vijay Dashami)" },
    { date: new Date(year, 9, 31), Occasion: "Diwali (Deepavali)" },
    { date: new Date(year, 10, 15), Occasion: "Guru Nanak Jayanti" },
    { date: new Date(year, 11, 25), Occasion: "Christmas Day" },
  ];
}

// Pre-filled daily routine sessions requested for every course day
const defaultDailySessions = [
  {
    startTime: "06:30",
    endTime: "07:30",
    type: "SQUAD_DRILL",
    title: "Squad Drill",
  },
  {
    startTime: "08:40",
    endTime: "09:00",
    type: "ROLL_CALL",
    title: "Roll Call",
  },
  { startTime: "11:15", endTime: "11:45", type: "BREAK", title: "Break" },
  { startTime: "13:15", endTime: "14:15", type: "LUNCH", title: "Lunch Break" },
  { startTime: "15:00", endTime: "15:30", type: "BREAK", title: "Break" },
  {
    startTime: "15:30",
    endTime: "16:15",
    type: "MAINTENANCE",
    title: "Maintenance",
  },
  { startTime: "17:00", endTime: "18:00", type: "GAMES", title: "Games" },
  {
    startTime: "21:00",
    endTime: "21:15",
    type: "ROLL_CALL",
    title: "Roll Call",
  },
];

async function seed() {
  console.log("==========================================");
  console.log("CFEES SDC DATABASE INITIALIZATION (SEED)");
  console.log("==========================================\n");

  await mongoose.connect("mongodb://127.0.0.1:27017/SDC");
  console.log("✅ Connected to MongoDB (mongodb://127.0.0.1:27017/SDC)\n");

  // Clear data for Year, Course, Applicant, Enrollment, and CourseSchedule
  console.log(
    "🧹 Clearing old data for: Year, Course, Applicant, Enrollment, CourseSchedule...",
  );
  await Enrollment.deleteMany({});
  await CourseSchedule.deleteMany({});
  await Applicant.deleteMany({});
  await Course.deleteMany({});
  await Year.deleteMany({});
  console.log("✅ Old data removed successfully.\n");

  // 1. SEED APPLICANTS
  console.log("👤 Creating realistic Indian Defense & DRDO Personnel...");
  const applicantsData = [];

  for (let i = 0; i < 60; i++) {
    const dept = randomItem(departments);
    let prefix = "IC";
    if (dept.includes("Air Force")) prefix = "AF";
    else if (dept.includes("Navy")) prefix = "N";
    else if (dept.includes("Coast Guard")) prefix = "CG";
    else if (dept.includes("DRDO")) prefix = "DRDO";

    applicantsData.push({
      department: dept,
      personnelNumber: `${prefix}-${randomInt(10000, 99999)}`,
      rank: randomItem(ranks),
      name: `${randomItem(firstNames)} ${randomItem(surnames)}`,
      unitAddress: randomItem(militaryUnits),
      contact: randomInt(7000000000, 9999999999),
    });
  }

  const applicantDocs = await Applicant.insertMany(applicantsData);
  console.log(`✅ Created ${applicantDocs.length} Applicants successfully.\n`);

  // 2. SEED YEARS, COURSES & SCHEDULES
  // Global course number sequence ensures NO course numbers clash across different years!
  let currentCourseNumber = 151;

  const trainingYears = [2023, 2024, 2025, 2026];

  for (const yearValue of trainingYears) {
    console.log(`--------------------------------------------------`);
    console.log(`📅 INITIALIZING TRAINING YEAR: ${yearValue}`);
    console.log(`--------------------------------------------------`);

    const holidays = getHolidaysForYear(yearValue);

    const yearDoc = await Year.create({
      year: yearValue,
      courses: [],
      holidays: holidays,
    });

    const courseScheduleTemplates = [
      {
        month: 0,
        weekIndex: 1,
        durationWeeks: 6,
        courseName: "General Course in Fire Fighting",
      },
      {
        month: 2,
        weekIndex: 1,
        durationWeeks: 4,
        courseName: "Basic Course in Elementary Fire Fighting",
      },
      {
        month: 4,
        weekIndex: 0,
        durationWeeks: 8,
        courseName: "Sub-Officer Fire Engineering Course",
      },
      {
        month: 6,
        weekIndex: 1,
        durationWeeks: 5,
        courseName: "Senior Fire Supervision Course",
      },
      {
        month: 8,
        weekIndex: 1,
        durationWeeks: 6,
        courseName: "Aircraft Rescue & Fire Fighting Course",
      },
      {
        month: 10,
        weekIndex: 0,
        durationWeeks: 4,
        courseName: "Industrial Fire Prevention & Safety Course",
      },
    ];

    let coursesCreated = 0;

    for (const template of courseScheduleTemplates) {
      const courseNum = currentCourseNumber++;

      // Start on a Monday
      const startDate = getMondayOfMonth(
        yearValue,
        template.month,
        template.weekIndex,
      );

      // End on a Friday (durationWeeks * 7 - 3 days from Monday)
      const endDate = addDays(startDate, template.durationWeeks * 7 - 3);

      // Safety check: ensure both dates belong strictly to yearValue
      if (
        startDate.getFullYear() !== yearValue ||
        endDate.getFullYear() !== yearValue
      ) {
        console.warn(
          `  ⚠️ Date overflow for Year ${yearValue}: ${startDate.toDateString()} - ${endDate.toDateString()}`,
        );
        continue;
      }

      const course = await Course.create({
        year: yearDoc._id,
        courseNumber: courseNum,
        courseName: template.courseName,
        startDate: startDate,
        endDate: endDate,
      });

      yearDoc.courses.push(course._id);
      coursesCreated++;

      // 3. CREATE PRE-FILLED COURSE SCHEDULE FOR THIS COURSE
      const weeks = generateWeeks(startDate, endDate);

      for (const week of weeks) {
        for (const day of week.days) {
          const isHoliday = holidays.some(
            (holiday) =>
              new Date(holiday.date).toDateString() ===
              new Date(day.date).toDateString(),
          );
          if (isHoliday) {
            day.sessions = [];
            continue;
          }
          day.sessions = defaultDailySessions.map((s) => ({ ...s }));
        }
      }

      await CourseSchedule.create({
        course: course._id,
        weeks: weeks,
      });

      // 4. ENROLL APPLICANTS INTO THIS COURSE
      const cohortSize = randomInt(22, 32);
      const shuffledApplicants = [...applicantDocs]
        .sort(() => Math.random() - 0.5)
        .slice(0, cohortSize);

      const enrollments = shuffledApplicants.map((applicant, idx) => {
        const reportingDate =
          Math.random() < 0.3 ? addDays(startDate, -1) : startDate;
        const moDate = addDays(reportingDate, -randomInt(5, 12));

        const leaves = [];
        const leaveCount = randomInt(0, 2);
        for (let l = 0; l < leaveCount; l++) {
          const dayOffset = randomInt(5, template.durationWeeks * 7 - 5);
          const leaveDate = addDays(startDate, dayOffset);
          if (leaveDate.getDay() !== 0 && leaveDate.getDay() !== 6) {
            if (
              !leaves.some(
                (existing) => existing.getTime() === leaveDate.getTime(),
              )
            ) {
              leaves.push(leaveDate);
            }
          }
        }

        const hasSOS = Math.random() < 0.08;
        const sosDate = hasSOS
          ? addDays(startDate, randomInt(7, template.durationWeeks * 7 - 6))
          : null;
        const sosReasons = [
          "Recalled by Parent Unit for Urgent Operational Duty",
          "Medical Sickness / Hospitalization",
          "Compassionate Grounds / Family Emergency",
        ];
        const sosReason = hasSOS ? randomItem(sosReasons) : null;

        return {
          applicantId: applicant._id,
          courseId: course._id,
          reportingDate: reportingDate,
          noonTime: Math.random() < 0.7 ? "ForeNoon" : "AfterNoon",
          MONumber: `MO/${yearValue}/TRG/${courseNum}/${String(idx + 1).padStart(3, "0")}`,
          MODate: moDate,
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
          leaves: leaves,
          SOS: sosDate,
          SOSReason: sosReason,
        };
      });

      await Enrollment.insertMany(enrollments);

      const startStr = startDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const endStr = endDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      console.log(
        `  📁 Course ${course.courseNumber} [${course.courseName}]: ${startStr} -> ${endStr} (${template.durationWeeks} wks, ${enrollments.length} enrolled, Schedule created with 8 daily sessions)`,
      );
    }

    await yearDoc.save();
    console.log(
      `✅ Year ${yearValue} saved with ${coursesCreated} courses and ${holidays.length} gazetted holidays.\n`,
    );
  }

  // 5. COMPREHENSIVE VERIFICATION
  console.log("==========================================");
  console.log("DATABASE AUDIT & YEAR INTEGRITY CHECK");
  console.log("==========================================");

  const totalYears = await Year.countDocuments();
  const totalCourses = await Course.countDocuments();
  const totalSchedules = await CourseSchedule.countDocuments();
  const totalApplicants = await Applicant.countDocuments();
  const totalEnrollments = await Enrollment.countDocuments();

  console.log(`📊 Total Years:            ${totalYears}`);
  console.log(`📊 Total Courses:          ${totalCourses}`);
  console.log(`📊 Total Course Schedules: ${totalSchedules}`);
  console.log(`📊 Total Applicants:       ${totalApplicants}`);
  console.log(`📊 Total Enrollments:      ${totalEnrollments}\n`);

  const allYears = await Year.find().populate("courses").sort({ year: 1 });
  let discrepancyFound = false;

  for (const y of allYears) {
    console.log(
      `🔍 Checking Training Year ${y.year} (${y.courses.length} courses):`,
    );
    for (const c of y.courses) {
      const sYear = c.startDate.getFullYear();
      const eYear = c.endDate.getFullYear();

      if (sYear !== y.year || eYear !== y.year) {
        console.error(
          `  ❌ YEAR MISMATCH: Course ${c.courseNumber} is in Year ${y.year}, but dates are ${sYear} to ${eYear}!`,
        );
        discrepancyFound = true;
      } else {
        const sched = await CourseSchedule.findOne({ course: c._id });
        const firstDaySessions =
          sched && sched.weeks[0] && sched.weeks[0].days[0]
            ? sched.weeks[0].days[0].sessions.length
            : 0;
        console.log(
          `  ✓ Course ${c.courseNumber}: Start ${c.startDate.toISOString().slice(0, 10)}, End ${c.endDate.toISOString().slice(0, 10)} -> Schedule: ${sched.weeks.length} weeks, ${firstDaySessions} daily sessions [VALID]`,
        );
      }
    }
  }

  if (!discrepancyFound) {
    console.log(
      "\n🎉 SUCCESS: 100% of courses have valid dates and pre-filled daily schedules!",
    );
  } else {
    console.error("\n❌ WARNING: Some courses had discrepancies!");
  }

  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed successfully.\n");
}

seed().catch(async (err) => {
  console.error("\n❌ SEED SCRIPT ERROR:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
