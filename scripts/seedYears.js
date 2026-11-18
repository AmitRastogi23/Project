const mongoose = require("mongoose");
const Year = require("../models/year");

// ================= FIXED HOLIDAY TEMPLATE =================
// month is 1-indexed (1 = Jan, 12 = Dec) — same as human reading
const HOLIDAY_TEMPLATE = [
  { month: 1, day: 26, occasion: "Republic Day" },
  { month: 3, day: 8, occasion: "Maha Shivratri" },
  { month: 3, day: 25, occasion: "Holi" },
  { month: 3, day: 29, occasion: "Good Friday" },
  { month: 4, day: 11, occasion: "Id-ul-Fitr" },
  { month: 4, day: 21, occasion: "Mahavir Jayanti" },
  { month: 5, day: 23, occasion: "Buddha Purnima" },
  { month: 6, day: 17, occasion: "Id-ul-Zuha (Bakrid)" },
  { month: 7, day: 17, occasion: "Muharram" },
  { month: 8, day: 15, occasion: "Independence Day" },
  { month: 8, day: 26, occasion: "Janmashtami" },
  { month: 9, day: 16, occasion: "Milad-un-Nabi" },
  { month: 10, day: 2, occasion: "Mahatma Gandhi Birthday" },
  { month: 10, day: 12, occasion: "Dussehra (Vijay Dashami)" },
  { month: 10, day: 31, occasion: "Diwali (Deepavali)" },
  { month: 11, day: 15, occasion: "Guru Nanak Jayanti" },
  { month: 12, day: 25, occasion: "Christmas Day" },
];

// ================= SAFE UTC DATE =================
// Returns a Date object at UTC midnight — NEVER shifts
function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

// ================= SEED =================
async function seedHolidays() {
  console.log("==========================================");
  console.log("SEED: HOLIDAYS (in-place, per Year doc)");
  console.log("==========================================\n");

  await mongoose.connect("mongodb://127.0.0.1:27017/SDC");
  console.log("✅ Connected to MongoDB (SDC)\n");

  const years = await Year.find().sort({ year: 1 });
  if (years.length === 0) {
    console.log("❌ No Year documents found.");
    await mongoose.connection.close();
    return;
  }

  console.log(`📊 Found ${years.length} year(s) in DB\n`);

  for (const yearDoc of years) {
    const y = yearDoc.year;

    const newHolidays = HOLIDAY_TEMPLATE.map((h) => ({
      date: utcDate(y, h.month, h.day),
      Occasion: h.occasion,
    }));

    // Only replace holidays array — nothing else
    yearDoc.holidays = newHolidays;
    await yearDoc.save();

    console.log(
      `  📅 Year ${y}: holidays reset (${newHolidays.length} entries)`,
    );

    // Spot check — show first 3
    newHolidays.slice(0, 3).forEach((h) => {
      const d = h.date;
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      console.log(`      → ${yyyy}-${mm}-${dd}  ${h.Occasion}`);
    });
  }

  console.log("\n🎉 Holidays reseeded!");
  console.log(
    "⚠️  Year.courses untouched. Course & CourseSchedule untouched.\n",
  );

  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed");
}

seedHolidays().catch(async (err) => {
  console.error("\n❌ SEED ERROR:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
