// scripts/seedFaculty.js
const mongoose = require("mongoose");
const Faculty = require("../models/faculty"); // path check kar lena

const MONGO_URI = "mongodb://127.0.0.1:27017/SDC";

// Helper — email banane ke liye
function generateEmail(name) {
  const clean = name
    .toLowerCase()
    .replace(/^(dr|shri|shrimati|mr|mrs|ms|prof)\.?\s+/i, "")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".");
  return `${clean}@drdo.in`;
}

const faculties = [
  // ───────── SDC Pilkhuwa ─────────
  {
    name: "Lavkush Kumar",
    rank: "Sc 'E'",
    organization: "SDC Pilkhuwa",
    email: generateEmail("Lavkush Kumar"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Rohit Arse",
    rank: "Sc 'D'",
    organization: "SDC Pilkhuwa",
    email: generateEmail("Rohit Arse"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Shantanu Deori",
    rank: "Sc 'E'",
    organization: "SDC Pilkhuwa",
    email: generateEmail("Shantanu Deori"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },

  // ───────── CFEES Delhi ─────────
  {
    name: "Bimal Kumar",
    rank: "Sc 'F'",
    organization: "CFEES Delhi",
    email: generateEmail("Bimal Kumar"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Alips Srivastava",
    rank: "Sc 'F'",
    organization: "CFEES Delhi",
    email: generateEmail("Alips Srivastava"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Pankaj Chawla",
    rank: "Sc 'E'",
    organization: "CFEES Delhi",
    email: generateEmail("Pankaj Chawla"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Kumar Kaushik",
    rank: "Sc 'F'",
    organization: "CFEES Delhi",
    email: generateEmail("Kumar Kaushik"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Banwari Lal",
    rank: "Sc 'F'",
    organization: "CFEES Delhi",
    email: generateEmail("Banwari Lal"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Supriya Kumari",
    rank: "Sc 'E'",
    organization: "CFEES Delhi",
    email: generateEmail("Supriya Kumari"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Dr. Mahipal Meena",
    rank: "Sc 'E'",
    organization: "CFEES Delhi",
    email: generateEmail("Dr. Mahipal Meena"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Shri KK Sharma",
    rank: "TO 'B'",
    organization: "CFEES Delhi",
    email: generateEmail("Shri KK Sharma"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },
  {
    name: "Dr. Ashutosh Saxena",
    rank: "TO 'B'",
    organization: "CFEES Delhi",
    email: generateEmail("Dr. Ashutosh Saxena"),
    address: "Delhi",
    isGuestFaculty: false,
    isRetired: false,
  },

  // ───────── Guest Faculty ─────────
  {
    name: "Shri Rajiv Narang",
    rank: "Former Director",
    organization: "CFEES Delhi",
    email: generateEmail("Shri Rajiv Narang"),
    address: "Delhi",
    isGuestFaculty: true,
    isRetired: true,
  },
  {
    name: "Dr KC Wadhwa",
    rank: "Sc 'H'",
    organization: "CFEES Delhi",
    email: generateEmail("Dr KC Wadhwa"),
    address: "Delhi",
    isGuestFaculty: true,
    isRetired: true,
  },
  {
    name: "HL Yadav",
    rank: "Sc 'F'",
    organization: "CFEES Delhi",
    email: generateEmail("HL Yadav"),
    address: "Delhi",
    isGuestFaculty: true,
    isRetired: true,
  },
  {
    name: "Dr RC Sharma",
    rank: "Former Director",
    organization: "DFS",
    email: generateEmail("Dr RC Sharma"),
    address: "Delhi",
    isGuestFaculty: true,
    isRetired: true,
  },
  {
    name: "Shri Amit Kumar Saini",
    rank: "Sc 'F'",
    organization: "DRDO HQ",
    email: generateEmail("Shri Amit Kumar Saini"),
    address: "Delhi",
    isGuestFaculty: true,
    isRetired: false,
  },
  {
    name: "Shri VS Hari Shankar",
    rank: "AGM (FS)",
    organization: "AAI",
    email: generateEmail("Shri VS Hari Shankar"),
    address: "Delhi",
    isGuestFaculty: true,
    isRetired: false,
  },
  {
    name: "Shri HS Rawat",
    rank: "GM (FS)",
    organization: "AAI",
    email: generateEmail("Shri HS Rawat"),
    address: "Delhi",
    isGuestFaculty: true,
    isRetired: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    await Faculty.deleteMany({});
    console.log("🗑️  Old faculty records cleared");

    const inserted = await Faculty.insertMany(faculties);
    console.log(`✅ Inserted ${inserted.length} faculty records\n`);

    console.log("📋 Preview:");
    inserted.forEach((f, i) => {
      console.log(
        `  ${String(i + 1).padStart(2, "0")}. ${f.name.padEnd(24)} | ${(f.rank || "").padEnd(16)} | ${(f.organization || "").padEnd(14)} | Guest: ${f.isGuestFaculty ? "Y" : "N"} | Retd: ${f.isRetired ? "Y" : "N"}`,
      );
    });

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
