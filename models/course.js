const mongoose = require("mongoose");

function getOrdinal(number) {
  const lastTwo = number % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[number % 10] || "th";
}

const courseSchema = new mongoose.Schema({
  year: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Year",
  },
  courseNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
  },
  ordinal: String,
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  courseDuration: Number,

  practicalConfig: {
    midTerm: {
      examinerName: { type: String, trim: true, default: "" },
      invigilatorName: { type: String, trim: true, default: "" },
      subjects: {
        type: [{ title: String, maxMarks: Number, minMarks: Number }],
        default: [
          { title: "Subject 1", maxMarks: 50, minMarks: 20 },
          { title: "Subject 2", maxMarks: 50, minMarks: 20 },
        ],
      },
    },
    finalTerm: {
      examinerName: { type: String, trim: true, default: "" },
      invigilatorName: { type: String, trim: true, default: "" },
      subjects: {
        type: [{ title: String, maxMarks: Number, minMarks: Number }],
        default: [
          { title: "Subject 1", maxMarks: 50, minMarks: 20 },
          { title: "Subject 2", maxMarks: 50, minMarks: 20 },
          { title: "Subject 3", maxMarks: 50, minMarks: 20 },
          { title: "Viva Voce", maxMarks: 50, minMarks: 20 },
        ],
      },
    },
  },

  conductConfig: {
    maxMarks: { type: Number, default: 15 },
    minMarks: { type: Number, default: 9 },
    evaluators: {
      type: [
        {
          key: { type: String, required: true },
          name: { type: String, trim: true },
        },
      ],
      default: [
        { key: "eval_1", name: "" },
        { key: "eval_2", name: "" },
        { key: "eval_3", name: "" },
      ],
    },
  },
});

courseSchema.pre("save", function () {
  const days = Math.floor((this.endDate - this.startDate) / 86400000) + 1;
  this.courseDuration = Math.ceil(days / 7);
  this.ordinal = getOrdinal(this.courseNumber);
});

module.exports = mongoose.model("Course", courseSchema);
