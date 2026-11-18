const express = require("express");
const router = express.Router();
const Address = require("../models/address");

// get addresses
router.get("/", async (req, res) => {
  try {
    const addresses = await Address.find().sort({ type: 1, name: 1 });
    res.render("address/show", { addresses });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

// add new address
router.post("/", async (req, res) => {
  const { name, address, phone, email, type } = req.body;

  if (!name || !name.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Name is required." });
  }
  if (!address || !address.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Address is required." });
  }
  if (!type || !["Examiner", "Guest Faculty's Institute"].includes(type)) {
    return res
      .status(400)
      .json({ success: false, message: "Valid type is required." });
  }

  try {
    const created = await Address.create({
      name: name.trim(),
      address: address.trim(),
      phone: phone ? phone.trim() : "",
      email: email ? email.trim().toLowerCase() : "",
      type,
    });
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    console.error("[POST /address]", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while adding address." });
  }
});

// update an address
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email, type } = req.body;

  const updates = {};

  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof address === "string" && address.trim())
    updates.address = address.trim();
  if (typeof phone === "string") updates.phone = phone.trim();
  if (typeof email === "string") updates.email = email.trim().toLowerCase();
  if (typeof type === "string") {
    if (!["Examiner", "Guest Faculty's Institute"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type." });
    }
    updates.type = type;
  }

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No valid fields provided." });
  }

  try {
    const updated = await Address.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found." });
    }
    return res.json({ success: true, data: updated });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    console.error(`[PATCH /address/${id}]`, err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating address.",
    });
  }
});

// delete an address
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Address.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found." });
    }

    return res.json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (err) {
    console.error(`[DELETE /address/${id}]`, err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting address.",
    });
  }
});

// get examiners address only
router.get("/examiners", async (req, res) => {
  try {
    const examiners = await Address.find({ type: "Examiner" })
      .select("_id name address phone email")
      .sort({ name: 1 });
    res.json({ success: true, examiners });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// get guest faculty address only
router.get("/guest-faculty", async (req, res) => {
  try {
    const institutes = await Address.find({
      type: "Guest Faculty's Institute",
    })
      .select("_id name address phone email")
      .sort({ name: 1 });
    res.json({ success: true, institutes });
  } catch (err) {
    console.error("[GET /address/guest-faculty]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
