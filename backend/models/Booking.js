const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor", // use dedicated contractor collection
      required: true,
    },
    serviceName: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    endDate: { type: Date },

    // STEP 1: Booking time fields (contractor arrival time + duration)
    booking_start_time: { type: String }, // Time contractor arrives (HH:MM format)
    booking_end_time: { type: Date }, // Calculated end time (start_time + bookingHours)

    // UPDATED: Hour-based and day-based duration
    bookingHours: { type: Number, min: 1, max: 12 }, // Hours for the job (1-12) - Optional for new bookings
    bookingDays: { type: Number, min: 1, default: 1 }, // Days duration
    totalDuration: { type: Number, min: 1 }, // NEW: Total duration in hours (calculated from start/end time)
    duration: { type: Number, default: 1 }, // Kept for backward compatibility

    totalPrice: { type: Number, required: true },
    isEmergency: { type: Boolean, default: false },

    // Contractor Acceptance Timer
    acceptanceExpiresAt: { type: Date }, // When contractor must respond by
    acceptanceExpired: { type: Boolean, default: false }, // If contractor failed to respond in time

    // User Payment Timer
    paymentExpiresAt: { type: Date }, // When user must upload payment by (2 hours after contractor accepts)
    paymentExpired: { type: Boolean, default: false }, // If user failed to upload payment in time

    // Payment & Proof
    paymentScreenshot: { type: String },
    completionImages: [{ type: String }], // Mandatory 2 images when contractor marks done
    problemImages: [{ type: String }], // Images uploaded by user when creating custom booking

    // NEW: Completion Proof Tracking
    completedAt: { type: Date }, // When contractor marked job done
    completedBy: { type: Date }, // Deadline for completion

    // User Satisfaction & Payment Tracking
    userSatisfied: { type: Boolean, default: false },
    satisfiedAt: { type: Date }, // When user clicked "Satisfied"
    autoCompletedAt: { type: Date }, // When auto-completion timer triggered
    incompleteRefundedAt: { type: Date }, // When contractor failed to complete job and user refunded

    // Payment Status Tracking
    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Completed",
        "Disputed",
        "Held",
        "Refunded",
      ],
      default: "Pending",
    },
    paymentVerificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    paymentVerifiedAt: { type: Date },
    paymentVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paymentRejectionReason: { type: String },
    paymentDecisionAmount: { type: Number },
    paymentDecisionMilestoneNumber: { type: Number },
    paymentHoldUntil: { type: Date }, // For 48-hour dispute hold

    // Phone Number Sharing - visible only after contractor accepts + payment complete + admin approves
    phoneNumbersVisible: { type: Boolean, default: false }, // Set to true only after all 3 conditions met

    // Dispute Reference
    dispute: { type: mongoose.Schema.Types.ObjectId, ref: "Dispute" }, // Link to dispute if one exists

    // Heavy Duty Construction specific fields
    bookingType: {
      type: String,
      enum: ["regular", "heavy-duty-construction"],
      default: "regular",
    },
    paymentSchedule: [
      {
        paymentNumber: Number,
        date: String,
        amount: Number,
        daysCompleted: Number,
        status: { type: String, enum: ["pending", "paid"], default: "pending" },
        workflowState: {
          type: String,
          enum: [
            "pending_payment",
            "payment_submitted",
            "funded",
            "in_progress",
            "completed",
            "approved",
            "auto_released",
            "expired_non_payment",
          ],
          default: "pending_payment",
        },
        paymentScreenshot: { type: String }, // Payment proof for this milestone
        paymentVerifiedAt: { type: Date }, // When admin verified this milestone payment
        releasedAt: { type: Date }, // When payment for this milestone was released
        autoReleasedAt: { type: Date }, // When milestone was auto-released by scheduler
        completionImages: [{ type: String }], // Images for this milestone
        completedAt: { type: Date }, // When this milestone was marked complete
        satisfactionDeadline: { type: Date }, // When user must approve/dispute by (3 hours after contractor submits completion)
        milestoneDeadline: { type: Date }, // When contractor must upload images by (exact milestone completion deadline)
        milestoneStartDate: { type: Date }, // When this milestone period starts
        startDay: { type: Number }, // Starting day of this milestone work period
        endDay: { type: Number }, // Ending day of this milestone work period
      },
    ],
    currentMilestone: { type: Number, default: 0 }, // Track which payment milestone is currently active (0-based index)
    isCustomJob: { type: Boolean, default: false },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },

    // Client contact info (visible only after payment approved by admin)
    clientPhone: { type: String },
    clientAddress: { type: String },
    clientArea: { type: String }, // Location/nearest area
    description: { type: String }, // Project description for heavy duty construction

    status: {
      type: String,
      enum: [
        "Pending_Contractor_Approval",
        "Pending_Approval",
        "Payment_Pending",
        "Approved_Pay_Pending",
        "Verification_Pending",
        "Rejected_Payment",
        "Active",
        "Completed",
        "Completed_And_Confirmed",
        "Cancelled",
        "Rejected",
        "Disputed",
        "Incomplete",
        "Expired_Non_Payment",
      ],
      default: "Pending_Approval",
    },
  },
  { timestamps: true },
);

// STEP 5: Database indexes for frequently queried fields
bookingSchema.index({ user: 1, status: 1 }); // User bookings filtered by status
bookingSchema.index({ contractor: 1, status: 1 }); // Contractor jobs filtered by status
bookingSchema.index({ status: 1, createdAt: -1 }); // Sorted by status and date
bookingSchema.index({ paymentStatus: 1 }); // Quick payment status lookups
bookingSchema.index({ booking_end_time: 1 }); // For timer queries
bookingSchema.index({ createdAt: -1 }); // Recent bookings query

module.exports = mongoose.model("Booking", bookingSchema);
