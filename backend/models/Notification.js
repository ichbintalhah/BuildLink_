const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // User field for customer notifications
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    // Contractor field for contractor notifications
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      index: true,
    },
    message: { type: String, required: true },
    type: { type: String, default: "info" }, // info, success, warning, error, message
    isRead: { type: Boolean, default: false },
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // Optional: link to booking
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // Generic related document ID
    // Navigation category - determines where clicking this notification takes the user
    notifCategory: {
      type: String,
      enum: [
        "booking_request",       // New booking → contractor workspace
        "booking_accepted",      // Contractor accepted → user bookings
        "booking_rejected",      // Contractor rejected → user bookings
        "job_completion",        // Job completed → user bookings
        "milestone_completion",  // Milestone done → user bookings
        "milestone_payment",     // Milestone payment released → contractor workspace
        "payment_verification",  // Payment uploaded → admin payments
        "payment_approved",      // Payment approved → user/contractor bookings/workspace
        "payment_rejected",      // Payment rejected → user bookings
        "payment_released",      // Payment released → contractor earnings
        "withdrawal_request",    // Withdrawal requested → admin withdrawals
        "withdrawal_approved",   // Withdrawal approved → contractor/user earnings
        "withdrawal_rejected",   // Withdrawal rejected → contractor/user earnings
        "withdrawal_processed",  // Withdrawal processed → admin withdrawals
        "dispute_created",       // Dispute created → disputes page
        "dispute_defense",       // Defense submitted → admin disputes
        "dispute_resolved",      // Dispute resolved → disputes page
        "message",               // New message → messages page
        "auto_complete",         // Auto-completed → user bookings / contractor workspace
        "acceptance_expired",    // Acceptance expired → user bookings / contractor workspace
        "payment_expired",       // Payment expired → user bookings / contractor workspace
        "milestone_expired",     // Milestone expired → user bookings / contractor workspace
        "refund",                // Refund → user bookings
        "general",               // General notification
      ],
      default: "general",
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ contractor: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
