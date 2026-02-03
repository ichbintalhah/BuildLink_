const mongoose = require("mongoose");

const advisorySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    problemDescription: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Scheduled", "Completed", "Cancelled"],
      default: "Pending",
    },
    notes: {
      type: String,
      default: "",
    },
    estimatedCost: {
      type: Number,
      default: 500, // Default consultation fee
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advisory", advisorySchema);
