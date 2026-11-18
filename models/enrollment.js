const mongoose = require("mongoose");
const Course = require("./course");
const Applicant = require("./applicant");

const enrollmentSchema = new mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applicant",
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  reportingDate: {
    type: Date,
    required: true,
  },
  noonTime: {
    type: String,
    required: true,
  },
  MONumber: {
    type: String,
    required: true,
  },
  MODate: {
    type: Date,
    required: true,
  },
  itemsReceived: {
    courseKit: {
      type: Boolean,
      default: false,
    },
    studyMaterial: {
      type: Boolean,
      default: false,
    },
    photograph: {
      type: Boolean,
      default: false,
    },
  },
  documentsReceived: {
    movementOrder: {
      type: Boolean,
      default: true,
    },
    resServiceCertificate: {
      type: Boolean,
      default: false,
    },
    medCertificate: {
      type: Boolean,
      default: false,
    },
    qualificationDocuments: {
      type: Boolean,
      default: false,
    },
    prevCourseCertificate: {
      type: Boolean,
      default: false,
    },
    passportPhoto: {
      type: Boolean,
      default: false,
    },
  },
  leaves: [
    {
      type: Date,
    },
  ],
  totalLeaves: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    default: 10,
    min: 0,
    max: 10,
  },
  SOS: {
    type: Date,
    default: "",
  },
  SOSReason: {
    type: String,
    default: null,
  },
});

enrollmentSchema.pre("save", async function () {
  if (this.isModified("leaves")) {
    this.leaves.sort((a, b) => a.getTime() - b.getTime());
  }
  let leavesCount = this.leaves.length; 
  this.totalLeaves = leavesCount;
  this.totalMarks = Math.max(0, 10 - leavesCount * 0.5);
});

const Enrollment = new mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;
