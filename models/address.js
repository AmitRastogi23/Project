const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Examiner", "Guest Faculty's Institute"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Address", addressSchema);
