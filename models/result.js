const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    paperNo: { type: Number },
    maxMarks: { type: Number },
    obtained: { type: Number },
    date: { type: Date },
  },
  { _id: false },
);

const practicalSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    maxMarks: { type: Number },
    obtained: { type: Number },
  },
  { _id: false },
);

const conductMarkSchema = new mongoose.Schema(
  {
    evaluatorKey: { type: String, required: true }, // "eval_1", "eval_2", etc.
    marks: { type: Number, default: null },
  },
  { _id: false },
);

const resultSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      unique: true,
    },
    theory: {
      midTerm: { type: [paperSchema], default: [] },
      finalTerm: { type: [paperSchema], default: [] },
    },
    practical: {
      midTerm: { type: [practicalSchema], default: [] },
      finalTerm: { type: [practicalSchema], default: [] },
    },

    conductKeenness: {
      marks: { type: [conductMarkSchema], default: [] },
      average: { type: Number, default: null },
    },
  },
  { timestamps: true },
);

resultSchema.pre("save", function () {
  const marksArr = this.conductKeenness?.marks || [];

  const valid = marksArr
    .map((m) => m.marks)
    .filter((m) => typeof m === "number" && !isNaN(m));

  this.conductKeenness.average = valid.length
    ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100
    : null;
});

module.exports = mongoose.model("Result", resultSchema);
