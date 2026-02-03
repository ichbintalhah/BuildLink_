const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reviewer
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Reviewed
    rating: { type: Number, required: true, min: 1, max: 5 },
    // STEP 1 FIX: Comment is optional - user can submit rating without text review
    // Frontend allows empty comments, so backend should too (prevents validation error)
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
