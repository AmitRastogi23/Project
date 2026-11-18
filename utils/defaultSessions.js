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

module.exports = defaultDailySessions;
