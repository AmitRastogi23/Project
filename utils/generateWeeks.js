function generateWeeks(
  startDate,
  endDate,
  holidays = [],
  defaultSessions = [],
) {
  const start = new Date(startDate);
  start.setUTCHours(12, 0, 0, 0);

  const end = new Date(endDate);
  end.setUTCHours(12, 0, 0, 0);

  const weeks = [];
  let date = new Date(start);
  let weekNumber = 1;

  // Holiday dates ko string format (YYYY-MM-DD) mein convert kar rahe hain for quick lookup
  const holidayStrings = holidays.map(
    (h) => new Date(h.date).toISOString().split("T")[0],
  );

  while (date <= end) {
    // Move to next Monday (UTC based)
    if (date.getUTCDay() !== 1) {
      const shift = (8 - date.getUTCDay()) % 7;
      date.setUTCDate(date.getUTCDate() + shift);
    }

    if (date > end) break;

    const weekStart = new Date(date);
    const days = [];

    for (let i = 0; i < 5 && date <= end; i++) {
      const dayDate = new Date(date);
      dayDate.setUTCHours(12, 0, 0, 0);

      const dateStr = dayDate.toISOString().split("T")[0];
      const isHoliday = holidayStrings.includes(dateStr);

      // Agar holiday hai toh sessions empty, warna defaultSessions ki deep copy
      const sessionsForDay = isHoliday
        ? []
        : defaultSessions.map((s) => ({ ...s }));

      days.push({
        date: dayDate,
        day: dayDate.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        }),
        sessions: sessionsForDay,
      });

      date.setUTCDate(date.getUTCDate() + 1);
    }

    weeks.push({
      weekNumber: weekNumber++,
      startDate: weekStart,
      endDate: days.at(-1).date,
      days,
    });

    date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + 7);
  }

  return weeks;
}

module.exports = generateWeeks;
