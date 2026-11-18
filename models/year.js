const mongoose = require("mongoose");
const Course = require("./course");

const yearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true,
  },
  courses: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    default: [],
  },
  holidays: [
    {
      date: Date,
      Occasion: String,
    },
  ],
});

yearSchema.pre("save", async function () {
  if (this.isModified("holidays")) {
    this.holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
});

const Year = new mongoose.model("Year", yearSchema);

module.exports = Year;
