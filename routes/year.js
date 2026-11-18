const express = require("express");
const router = express.Router();
const Year = require("../models/year");
const wrapAsync = require("../utils/wrapAsync");

function validateDateInYear(yearValue, dateStr) {
  if (!dateStr) {
    return { ok: false, message: "Date is required." };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { ok: false, message: "Invalid date format." };
  }
  const dateYear = d.getUTCFullYear();
  if (dateYear !== yearValue) {
    return {
      ok: false,
      message: `Date year (${dateYear}) does not match this year (${yearValue}). Please select a date from ${yearValue}.`,
    };
  }
  return { ok: true, date: d };
}

// select year to view course route
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const years = await Year.find().sort({ year: 1 });
    res.render("year/search.ejs", { years });
  }),
);
// select course to view applicant route
router.get(
  "/:yearId",
  wrapAsync(async (req, res) => {
    let { yearId } = req.params;
    const year = await Year.findById(yearId).populate("courses");
    res.render("year/show.ejs", { courses: year.courses, year: year });
  }),
);

// add holiday in a year
router.post(
  "/:yearId/holidays",
  wrapAsync(async (req, res) => {
    const { yearId } = req.params;
    const { date, occasion } = req.body;

    const year = await Year.findById(yearId);
    if (!year) return res.status(404).send("Year not found.");

    const check = validateDateInYear(year.year, date);
    if (!check.ok) {
      return res.status(400).send(check.message);
    }

    if (!occasion || !occasion.trim()) {
      return res.status(400).send("Occasion is required.");
    }

    const dateKey = check.date.toISOString().split("T")[0];
    const alreadyExists = year.holidays.some(
      (h) => new Date(h.date).toISOString().split("T")[0] === dateKey,
    );

    if (alreadyExists) {
      return res.status(400).send("Holiday already exists for this date.");
    }

    year.holidays.push({
      date: check.date,
      Occasion: occasion.trim(),
    });

    await year.save();

    res.redirect(`/year/${yearId}`);
  }),
);

// delete a holiday from a year
router.delete(
  "/:yearId/holidays/:holidayId",
  wrapAsync(async (req, res) => {
    const { yearId, holidayId } = req.params;
    const year = await Year.findById(yearId);
    year.holidays.id(holidayId).deleteOne();
    await year.save();
    res.redirect(`/year/${yearId}`);
  }),
);

// update holiday in an year
router.put(
  "/:yearId/holidays/:holidayId",
  wrapAsync(async (req, res) => {
    const { yearId, holidayId } = req.params;
    const { date, occasion } = req.body;

    const year = await Year.findById(yearId);
    if (!year) return res.status(404).send("Year not found.");

    const check = validateDateInYear(year.year, date);
    if (!check.ok) {
      return res.status(400).send(check.message);
    }

    if (!occasion || !occasion.trim()) {
      return res.status(400).send("Occasion is required.");
    }

    const holiday = year.holidays.id(holidayId);
    if (!holiday) return res.status(404).send("Holiday not found.");

    const dateKey = check.date.toISOString().split("T")[0];
    const dupExists = year.holidays.some((h) => {
      if (h._id.toString() === holidayId) return false;
      return new Date(h.date).toISOString().split("T")[0] === dateKey;
    });

    if (dupExists) {
      return res
        .status(400)
        .send("Another holiday already exists for this date.");
    }

    holiday.date = check.date;
    holiday.Occasion = occasion.trim();

    await year.save();

    res.sendStatus(200);
  }),
);

module.exports = router;
