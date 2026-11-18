const mongoose = require("mongoose");
const Enrollment = require("./enrollment");

const applicantSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
  },
  personnelNumber: {
    type: String,
    required: true,
  },
  rank: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  unitAddress: {
    type: String,
    required: true,
  },
  contact: {
    type: Number,
  },
});

applicantSchema.pre("findOneAndDelete", async function (next) {
  try {
    const applicantId = this.getQuery()._id;
    const result = await Enrollment.deleteMany({ applicantId });
    next();
  } catch (err) {
    next(err);
  }
});

const Applicant = new mongoose.model("Applicant", applicantSchema);

module.exports = Applicant;
