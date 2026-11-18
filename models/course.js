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
});

courseSchema.pre("save", function () {
  const days = Math.floor((this.endDate - this.startDate) / 86400000) + 1;
  this.courseDuration = Math.ceil(days / 7);
  this.ordinal = getOrdinal(this.courseNumber);
});

module.exports = mongoose.model("Course", courseSchema);
