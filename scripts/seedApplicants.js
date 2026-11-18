const mongoose = require("mongoose");
const Applicant = require("../models/applicant");

const departments = [
  "Army",
  "Air Force",
  "Navy",
  "Drona",
  "CoastGuard",
  "Munitions India Limited",
  "LRDE , DRDO",
  "DMRE , DRDO",
  "DIHAR , DRDO",
  "R&DE , DRDO",
];

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

// ================= DEPARTMENT-WISE UNIT ADDRESSES =================
const unitsByDepartment = {
  Army: [
    "23 Armoured Regiment, Ambala",
    "HQ Western Command, Chandimandir",
    "501 Field Maintenance Station, Pathankot",
    "14 Corps Signal Regiment, Leh",
    "12 Para (SF), Agra",
    "CFEES SDC, Pilkhuwa",
  ],
  "Air Force": [
    "Air Force Station, Hindon",
    "Air Force Academy, Dundigal, Hyderabad",
    "Air Force Station, Ambala",
    "Air Force Station, Jodhpur",
    "Air Force Station, Tezpur",
  ],
  Navy: [
    "INS Hansa, Goa",
    "Naval Dockyard, Mumbai",
    "INS Shivaji, Lonavala",
    "INS Vikramaditya, Karwar",
    "INS Chilka, Odisha",
  ],
  Drona: ["DRONA Academy, Gurugram", "DRONA Training Centre, Delhi"],
  CoastGuard: [
    "Coast Guard Station, Chennai",
    "Coast Guard Station, Mumbai",
    "Coast Guard Air Station, Daman",
    "Coast Guard Regional HQ, Kochi",
  ],
  "Munitions India Limited": [
    "Munitions India Limited, Pune",
    "Munitions India Limited, Chanda",
    "Munitions India Limited, Nalanda",
    "Munitions India Limited, Bhandara",
  ],
  "LRDE , DRDO": [
    "LRDE, Bengaluru",
    "LRDE, DRDO Complex, Bengaluru",
    "LRDE, Timarpur, Delhi",
  ],
  "DMRE , DRDO": ["DMRE, Pune", "DMRE, DRDO Complex, Pune"],
  "DIHAR , DRDO": ["DIHAR, Leh", "DIHAR, DRDO Complex, Leh"],
  "R&DE , DRDO": [
    "R&DE (E), Pune",
    "R&DE (Engrs), Pune",
    "DRDO SASE, Chandigarh",
  ],
};

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Department-wise personnel number prefix
function getPersonnelPrefix(dept) {
  switch (dept) {
    case "Army":
      return "IC";
    case "Air Force":
      return "AF";
    case "Navy":
      return "N";
    case "Drona":
      return "DR";
    case "CoastGuard":
      return "CG";
    case "Munitions India Limited":
      return "MIL";
    case "LRDE , DRDO":
      return "LRDE";
    case "DMRE , DRDO":
      return "DMRE";
    case "DIHAR , DRDO":
      return "DIHAR";
    case "R&DE , DRDO":
      return "RDE";
    default:
      return "GN";
  }
}

// Department-wise unit address
function getUnitForDept(dept) {
  const pool = unitsByDepartment[dept];
  if (!pool || pool.length === 0) return "CFEES SDC, Pilkhuwa";
  return randomItem(pool);
}

async function seedApplicants() {
  console.log("==========================================");
  console.log("SEED: APPLICANTS ONLY");
  console.log("==========================================\n");

  await mongoose.connect("mongodb://127.0.0.1:27017/SDC");
  console.log("✅ Connected to MongoDB (SDC)\n");

  const beforeCount = await Applicant.countDocuments();
  console.log(`📊 Existing applicants: ${beforeCount}`);

  const deleted = await Applicant.deleteMany({});
  console.log(`🧹 Deleted applicants: ${deleted.deletedCount}\n`);

  const TOTAL = 60;
  const applicantsData = [];

  for (let i = 0; i < TOTAL; i++) {
    const dept = randomItem(departments);
    const prefix = getPersonnelPrefix(dept);

    applicantsData.push({
      department: dept,
      personnelNumber: `${prefix}-${randomInt(10000, 99999)}`,
      rank: randomItem(ranks),
      name: `${randomItem(firstNames)} ${randomItem(surnames)}`,
      unitAddress: getUnitForDept(dept), // <-- department-wise
      contact: randomInt(7000000000, 9999999999),
    });
  }

  const inserted = await Applicant.insertMany(applicantsData);
  console.log(`✅ Inserted ${inserted.length} applicants\n`);

  const afterCount = await Applicant.countDocuments();
  console.log(`📊 Total applicants now: ${afterCount}`);

  console.log("\n🎉 Applicant seed complete!");
  console.log(
    "⚠️  Note: Course, CourseSchedule, Year, Enrollment, Faculty — UNTOUCHED\n",
  );

  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed");
}

seedApplicants().catch(async (err) => {
  console.error("\n❌ SEED ERROR:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
