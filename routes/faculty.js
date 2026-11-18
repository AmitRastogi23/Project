const express = require("express");
const router = express.Router();
const Faculty = require("../models/faculty");

router.get("/", (req, res) => {
  res.render("faculty/show"); // Data JS fetch karega
});

router.get("/api/list", async (req, res) => {
  try {
    const faculties = await Faculty.find().sort({ organization: 1, name: 1 });
    res.json({
      success: true,
      faculties,
    });
  } catch (err) {
    console.error("[GET /faculty/api/list]", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.delete("/:facultyId", async (req, res) => {
  const { facultyId } = req.params;
  try {
    const deleted = await Faculty.findByIdAndDelete(facultyId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }
    return res.json({
      success: true,
      message: "Faculty deleted successfully.",
      data: { _id: deleted._id, name: deleted.name },
    });
  } catch (err) {
    console.error(`[DELETE /faculty/${facultyId}]`, err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting faculty.",
    });
  }
});

router.patch("/:facultyId", async (req, res) => {
  const { facultyId } = req.params;
  const {
    name,
    rank,
    organization,
    email,
    phone,
    address,
    isGuestFaculty,
    isRetired,
  } = req.body;

  const updates = {};

  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof rank === "string") updates.rank = rank.trim();
  if (typeof organization === "string")
    updates.organization = organization.trim();
  if (typeof email === "string") updates.email = email.trim().toLowerCase();
  if (typeof phone === "string") updates.phone = phone.trim();
  if (typeof address === "string") updates.address = address.trim();
  if (typeof isGuestFaculty === "boolean")
    updates.isGuestFaculty = isGuestFaculty;
  if (typeof isRetired === "boolean") updates.isRetired = isRetired;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid fields provided for update.",
    });
  }

  try {
    const updated = await Faculty.findByIdAndUpdate(
      facultyId,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    return res.json({
      success: true,
      message: "Faculty updated successfully.",
      data: updated,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    console.error(`[PATCH /faculty/${facultyId}]`, err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating faculty.",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 5. PUT — Add a new faculty
// ═══════════════════════════════════════════════════════════════
router.put("/", async (req, res) => {
  const {
    name,
    rank,
    organization,
    email,
    phone,
    address,
    isGuestFaculty,
    isRetired,
  } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Name is required.",
    });
  }

  try {
    const faculty = await Faculty.create({
      name: name.trim(),
      rank: typeof rank === "string" ? rank.trim() : "",
      organization: typeof organization === "string" ? organization.trim() : "",
      email: typeof email === "string" ? email.trim().toLowerCase() : "",
      phone: typeof phone === "string" ? phone.trim() : "",
      address: typeof address === "string" ? address.trim() : "",
      isGuestFaculty: isGuestFaculty === true,
      isRetired: isRetired === true,
    });

    return res.status(201).json({
      success: true,
      message: "Faculty added successfully.",
      data: faculty,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    console.error("[PUT /faculty]", err);
    return res.status(500).json({
      success: false,
      message: "Server error while adding faculty.",
    });
  }
});

module.exports = router;
