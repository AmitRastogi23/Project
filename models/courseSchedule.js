const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "SQUAD_DRILL",
        "ROLL_CALL",
        "PRACTICAL",
        "THEORY",
        "BREAK",
        "LUNCH",
        "MAINTENANCE",
        "GAMES",
        "MID_TERM",
        "FINAL_TERM",
        "INSTRUCTIONAL_VISIT",
        "REVISION",
        "OTHER",
        "VALEDICTORY_FUNCTION",
      ],
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    faculty: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Faculty",
      default: null,
    },
    location: {
      type: String,
      trim: true,
    },
  },
  { _id: true },
);

const daySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    sessions: [sessionSchema],
  },
  { _id: false },
);

const weekSchema = new mongoose.Schema(
  {
    weekNumber: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    docSupport1: { type: String, trim: true, default: "" },
    docSupport2: { type: String, trim: true, default: "" },
    days: [daySchema],
  },
  { _id: false },
);

const courseScheduleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      unique: true,
    },
    weeks: [weekSchema],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("CourseSchedule", courseScheduleSchema);
