const mongoose = require("mongoose");

const signatorySchema = new mongoose.Schema(
  {
    authorities: {
      type: [
        {
          key: {
            type: String,
            required: true,
          },
          designation: {
            type: String,
            required: true,
          },
          name: {
            type: String,
            trim: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Signatory = mongoose.model("signs", signatorySchema);

module.exports = Signatory;
