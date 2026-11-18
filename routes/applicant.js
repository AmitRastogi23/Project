const express = require("express");
const router = express.Router();

const Applicant = require("../models/applicant");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Signatory = require("../models/signatory");

const wrapAsync = require("../utils/wrapAsync");

const generateNominalRoll = require("../utils/PDF/nominalRollGenerator");
const generateDetentionCertificates = require("../utils/PDF/detentionCertificateGenerator");
const generateCompletionCertificate = require("../utils/PDF/completionCertificateGenerator");
const generateClearanceCertificate = require("../utils/PDF/clearanceCertificateGenerator");
const generateItemsList = require("../utils/PDF/itemsListGenerator");
const generateDocumentsList = require("../utils/PDF/documentsListGenerator");
const generateAttendanceMarks = require("../utils/PDF/attendanceMarksGenerator");
const generateSOS = require("../utils/PDF/sosGenerator");

const generateNominalRollExcel = require("../utils/Excel/nominalRollGenerator");
const generateClearanceExcel = require("../utils/Excel/clearanceCertificateGenerator");
const generateItemsListExcel = require("../utils/Excel/itemsListGenerator");
const generateDocumentsListExcel = require("../utils/Excel/documentsListGenerator");
const generateAttendanceMarksExcel = require("../utils/Excel/attendanceMarksGenerator");
const generateSOSExcel = require("../utils/Excel/sosGenerator");

// rendering EJS for search applicant
router.get("/search", (req, res) => {
  res.render("applicant/search.ejs");
});

// route to get applicant record
router.get(
  "/search/:personnelNumber/:name",
  wrapAsync(async (req, res) => {
    const { personnelNumber, name } = req.params;

    const applicant = await Applicant.findOne({
      personnelNumber: personnelNumber,
      name: name,
    });

    if (!applicant) {
      return res.status(404).json({
        message: "Applicant not found",
      });
    }

    const enrollments = await Enrollment.find({
      applicantId: applicant._id,
    }).populate("courseId");

    res.json({
      applicant,
      enrollments,
    });
  }),
);

// Adding new applicant route
router.get(
  "/new/:courseId",
  wrapAsync(async (req, res) => {
    const courseDoc = await Course.findById(req.params.courseId);
    res.render("applicant/new.ejs", { courseDoc });
  }),
);
router.post(
  "/:courseId",
  wrapAsync(async (req, res) => {
    const { courseId: id } = req.params;
    const personnelNumber = req.body.personnelNumber;

    // Handle "Others" department
    let department = req.body.department;
    if (department === "Others") {
      department = req.body.otherDepartment?.trim();
      if (!department) {
        return res.status(400).send("Please specify the department name.");
      }
    }

    // Check existing: PN + Name + Department
    let appDoc = await Applicant.findOne({
      personnelNumber: personnelNumber.trim(),
    });

    if (!appDoc) {
      appDoc = new Applicant({
        department: department.trim(),
        personnelNumber: personnelNumber.trim(),
        rank: req.body.rank,
        name: req.body.name.trim(),
        unitAddress: req.body.unitAddress,
        contact: req.body.contact,
      });
      await appDoc.save();
    }

    // Enrollment check
    const enrollDoc = await Enrollment.findOne({
      applicantId: appDoc._id,
      courseId: id,
    });

    if (enrollDoc) {
      return res.send("Applicant already enrolled");
    }

    const newEnroll = new Enrollment({
      applicantId: appDoc._id,
      courseId: id,
      reportingDate: req.body.reportingDate,
      noonTime: req.body.noontime,
      MONumber: req.body.MONumber,
      MODate: req.body.MODate,
    });
    await newEnroll.save();

    res.redirect(`/applicant/new/${id}`);
  }),
);

// generate nominal roll route
router.post(
  "/:courseId/nominalRoll",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    const applicants = req.body.applicants;
    generateNominalRoll(res, course, applicants);
  }),
);

// generate nominal roll excel
router.post(
  "/:courseId/nominalRoll/excel",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    const applicants = req.body.applicants;
    generateNominalRollExcel(res, course, applicants);
  }),
);

// generate detention certificate route
router.get(
  "/:courseId/detention",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    const signDoc = await Signatory.findOne({});
    generateDetentionCertificates(res, course, enrollDoc, signDoc);
  }),
);

router.get(
  "/:courseId/detention/preview",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    const signDoc = await Signatory.findOne({});
    generateDetentionCertificates(res, course, enrollDoc, signDoc, true);
  }),
);

router.get(
  "/:courseId/detention/:appId",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    const enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
      applicantId: req.params.appId,
    }).populate("applicantId");
    const signDoc = await Signatory.findOne({});
    generateDetentionCertificates(res, course, enrollDoc, signDoc);
  }),
);

// generate course completion certificate
router.get(
  "/:courseId/completion",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    const signDoc = await Signatory.findOne({});
    generateCompletionCertificate(res, course, enrollDoc, signDoc);
  }),
);

router.get(
  "/:courseId/completion/preview",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    const signDoc = await Signatory.findOne({});
    generateCompletionCertificate(res, course, enrollDoc, signDoc, true); // true = inline preview
  }),
);

router.get(
  "/:courseId/completion/:appId",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    const enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
      applicantId: req.params.appId,
    }).populate("applicantId");
    const signDoc = await Signatory.findOne({});
    generateCompletionCertificate(res, course, enrollDoc, signDoc);
  }),
);

// generate course clearance certificate
router.get(
  "/:courseId/clearance",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    const signDoc = await Signatory.findOne({});
    generateClearanceCertificate(res, course, enrollDoc, signDoc);
  }),
);

router.get(
  "/:courseId/clearance/excel",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    generateClearanceExcel(res, course, enrollDoc);
  }),
);

router.get(
  "/:courseId/clearance/preview",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    const signDoc = await Signatory.findOne({});
    generateClearanceCertificate(res, course, enrollDoc, signDoc, true); // true = inline preview
  }),
);

// route to render items list template
router.get(
  "/:courseId/items",
  wrapAsync(async (req, res) => {
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    res.render("applicant/showItems.ejs", { enrollDoc });
  }),
);
// route to update the changes in items list in database
router.post(
  "/:courseId/items",
  wrapAsync(async (req, res) => {
    const { enrollmentIds, courseKit, studyMaterial, photograph } = req.body;
    for (const enrollmentId of enrollmentIds) {
      await Enrollment.findByIdAndUpdate(enrollmentId, {
        "itemsReceived.courseKit": courseKit?.includes(enrollmentId),
        "itemsReceived.studyMaterial": studyMaterial?.includes(enrollmentId),
        "itemsReceived.photograph": photograph?.includes(enrollmentId),
      });
    }
    res.redirect(`/applicant/${req.params.courseId}/items`);
  }),
);
// generate item list pdf
router.get(
  "/:courseId/items/pdf",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    generateItemsList(res, course, enrollDoc);
  }),
);
router.get(
  "/:courseId/items/excel",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    generateItemsListExcel(res, course, enrollDoc);
  }),
);

// route to render document list template
router.get(
  "/:courseId/documents",
  wrapAsync(async (req, res) => {
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    res.render("applicant/showDocuments.ejs", { enrollDoc });
  }),
);

// route to update changes in document list in database
router.post(
  "/:courseId/documents",
  wrapAsync(async (req, res) => {
    const {
      enrollmentIds,
      movementOrder,
      resServiceCertificate,
      medCertificate,
      qualificationDocuments,
      prevCourseCertificate,
      passportPhoto,
    } = req.body;

    if (!enrollmentIds || enrollmentIds.length === 0) {
      return res.redirect(`/applicant/${req.params.courseId}/documents`);
    }

    for (const enrollmentId of enrollmentIds) {
      await Enrollment.findByIdAndUpdate(enrollmentId, {
        "documentsReceived.movementOrder":
          movementOrder?.includes(enrollmentId) || false,
        "documentsReceived.resServiceCertificate":
          resServiceCertificate?.includes(enrollmentId) || false,
        "documentsReceived.medCertificate":
          medCertificate?.includes(enrollmentId) || false,
        "documentsReceived.qualificationDocuments":
          qualificationDocuments?.includes(enrollmentId) || false,
        "documentsReceived.prevCourseCertificate":
          prevCourseCertificate?.includes(enrollmentId) || false,
        "documentsReceived.passportPhoto":
          passportPhoto?.includes(enrollmentId) || false,
      });
    }

    res.redirect(`/applicant/${req.params.courseId}/documents`);
  }),
);
// generate document list pdf
router.get("/:courseId/documents/pdf", async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate("year");
  let enrollDoc = await Enrollment.find({
    courseId: req.params.courseId,
  }).populate("applicantId");
  enrollDoc = sortEnroll(enrollDoc);
  generateDocumentsList(res, course, enrollDoc);
});
router.get(
  "/:courseId/documents/excel",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    generateDocumentsListExcel(res, course, enrollDoc);
  }),
);

router.get(
  "/:courseId/attendance",
  wrapAsync(async (req, res) => {
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    res.render("applicant/showLeaves.ejs", { enrollDoc });
  }),
);
router.get(
  "/:courseId/attendance/pdf",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    generateAttendanceMarks(res, course, enrollDoc);
  }),
);
router.get("/:courseId/attendance/excel", async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate("year");
  let enrollDoc = await Enrollment.find({
    courseId: req.params.courseId,
  }).populate("applicantId");
  enrollDoc = sortEnroll(enrollDoc);
  generateAttendanceMarksExcel(res, course, enrollDoc);
});
router.post(
  "/:enrollmentId/addleave",
  wrapAsync(async (req, res) => {
    const { enrollmentId } = req.params;
    const { date } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);
    enrollment.leaves.push(new Date(date));

    await enrollment.save();

    res.redirect(`/applicant/${enrollment.courseId}/attendance`);
  }),
);

router.get(
  "/:courseId/SOS",
  wrapAsync(async (req, res) => {
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    res.render("applicant/showSOS.ejs", { enrollDoc });
  }),
);
router.get(
  "/:courseId/SOS/pdf",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    generateSOS(res, course, enrollDoc);
  }),
);
router.get(
  "/:courseId/SOS/excel",
  wrapAsync(async (req, res) => {
    const course = await Course.findById(req.params.courseId).populate("year");
    let enrollDoc = await Enrollment.find({
      courseId: req.params.courseId,
    }).populate("applicantId");
    enrollDoc = sortEnroll(enrollDoc);
    generateSOSExcel(res, course, enrollDoc);
  }),
);
router.post(
  "/:enrollmentId/addSOS",
  wrapAsync(async (req, res) => {
    const { enrollmentId } = req.params;
    const { date, reason } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);
    enrollment.SOS = new Date(date);
    enrollment.SOSReason = reason || null;
    await enrollment.save();

    res.redirect(`/applicant/${enrollment.courseId}/SOS`);
  }),
);

// View all applicants route
router.get(
  "/:courseId",
  wrapAsync(async (req, res) => {
    const { courseId: id } = req.params;
    res.render("applicant/show.ejs", { id });
  }),
);

// Get unique departments of applicants enrolled in this course
router.get(
  "/:courseId/departments",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;

    const enrollments = await Enrollment.find({ courseId })
      .populate("applicantId", "department")
      .lean();

    const departmentSet = new Set();

    enrollments.forEach((e) => {
      if (e.applicantId && e.applicantId.department) {
        departmentSet.add(e.applicantId.department.trim());
      }
    });

    const departments = Array.from(departmentSet).sort((a, b) =>
      a.localeCompare(b),
    );

    return res.json({ departments });
  }),
);

// route to get single department record or complete nominal roll
router.get(
  "/:courseId/:department",
  wrapAsync(async (req, res) => {
    const { courseId } = req.params;
    const { department } = req.params;

    let enrollDoc = await Enrollment.find({
      courseId: courseId,
    }).populate("applicantId");

    if (department === "Complete") {
      enrollDoc = sortEnroll(enrollDoc);
      res.json(enrollDoc);
    } else {
      enrollDoc = enrollDoc.filter(
        (enroll) => enroll.applicantId.department === department,
      );
      res.json(enrollDoc);
    }
  }),
);

// Delete an enrollment
router.delete(
  "/:courseId/enrollment/:enrollmentId",
  wrapAsync(async (req, res) => {
    const { courseId, enrollmentId } = req.params;

    const deleted = await Enrollment.findOneAndDelete({
      _id: enrollmentId,
      courseId: courseId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    return res.json({
      success: true,
      message: "Enrollment deleted successfully",
    });
  }),
);

router.patch(
  "/edit/:applicantId",
  wrapAsync(async (req, res) => {
    const { applicantId } = req.params;
    const { department, personnelNumber, rank, name, unitAddress, contact } =
      req.body;

    if (!department || !personnelNumber || !rank || !name || !unitAddress) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled.",
      });
    }

    const duplicate = await Applicant.findOne({
      personnelNumber: personnelNumber,
      _id: { $ne: applicantId },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Personnel number "${personnelNumber}" is already assigned to another applicant.`,
      });
    }

    const updated = await Applicant.findByIdAndUpdate(
      applicantId,
      {
        department: department.trim(),
        personnelNumber: personnelNumber.trim(),
        rank: rank.trim(),
        name: name.trim(),
        unitAddress: unitAddress.trim(),
        contact: contact ? Number(contact) : undefined,
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found.",
      });
    }

    return res.json({
      success: true,
      message: "Applicant updated successfully.",
      applicant: updated,
    });
  }),
);

router.delete(
  "/:applicantId",
  wrapAsync(async (req, res) => {
    const { applicantId } = req.params;
    const deleted = await Applicant.findOneAndDelete({
      _id: applicantId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found.",
      });
    }

    return res.json({
      success: true,
      message: "Applicant and all their enrollments deleted successfully.",
    });
  }),
);

// Update an enrollment (only editable fields)
router.patch(
  "/:courseId/enrollment/:enrollmentId",
  wrapAsync(async (req, res) => {
    const { courseId, enrollmentId } = req.params;
    const { reportingDate, noonTime, MONumber, MODate } = req.body;

    // Basic validation
    if (!reportingDate || !noonTime || !MONumber || !MODate) {
      return res.status(400).json({
        success: false,
        message: "All editable fields are required",
      });
    }

    const updated = await Enrollment.findOneAndUpdate(
      {
        _id: enrollmentId,
        courseId: courseId,
      },
      {
        reportingDate,
        noonTime,
        MONumber,
        MODate,
      },
      { new: true, runValidators: true },
    ).populate("applicantId");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    return res.json({
      success: true,
      message: "Enrollment updated successfully",
      enrollment: updated,
    });
  }),
);

function sortEnroll(enroll) {
  enroll.sort((a, b) =>
    a.applicantId.department.localeCompare(b.applicantId.department),
  );
  return enroll;
}

module.exports = router;
