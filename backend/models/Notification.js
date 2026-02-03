const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // STEP 3 FIX: User field REQUIRED - ensures notifications are scoped to individual users
    // CRITICAL: This prevents one user from seeing another's notifications (privacy leak)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    type: { type: String, default: "info" }, // info, success, warning, error
    isRead: { type: Boolean, default: false },
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // Optional: link to booking
  },
  { timestamps: true }
);

// STEP 3 FIX: Index on user field for faster queries - ensures privacy by design
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
