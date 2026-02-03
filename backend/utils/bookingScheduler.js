/**
 * Booking Auto-Completion, Incomplete Job Scheduler & Availability Manager
 * Runs periodically to:
 * 1. Auto-complete jobs after 3 hours with no user satisfaction
 * 2. Auto-refund jobs if contractor fails to complete within agreed time
 * 3. Auto-update contractor availability (Red -> Green) when tasks expire
 */

const Booking = require("../models/Booking");
const User = require("../models/User");
const Contractor = require("../models/Contractor");
const Notification = require("../models/Notification");
// Ensure this path matches where your paymentService is located relative to this file
const { calculateNormalPayment } = require("./paymentService");

/**
 * Helper function to update contractor availability based on active jobs.
 * * Logic:
 * - Contractor is BUSY (Red) ONLY if they have an ACTIVE job where
 * current_time is less than booking_end_time.
 * - Otherwise, they are AVAILABLE (Green).
 */
const updateContractorAvailability = async (contractorId) => {
  try {
    console.log(
      `[AVAILABILITY] Starting update for contractorId:`,
      contractorId,
    );

    // Ensure we have just the ID, not the full object
    let contractorIdString;
    if (contractorId._id) {
      contractorIdString = contractorId._id.toString();
      console.log(
        `[AVAILABILITY] Converted object ID to string: ${contractorIdString}`,
      );
    } else {
      contractorIdString = contractorId.toString();
    }

    const now = new Date();
    console.log(`[AVAILABILITY] Current time: ${now.toISOString()}`);

    // Find all ACTIVE bookings for this contractor
    console.log(
      `[AVAILABILITY] Searching for Active bookings with contractor ID: ${contractorIdString}`,
    );
    const activeBookings = await Booking.find({
      contractor: contractorIdString,
      status: "Active",
    });

    console.log(
      `[AVAILABILITY] Found ${activeBookings.length} active bookings for contractor ${contractorIdString}`,
    );

    // Check if any active booking is currently in-progress (time hasn't expired)
    let isBusy = false;
    for (const booking of activeBookings) {
      const bookingEnd = new Date(booking.booking_end_time);

      // If the job's end time is still in the future, the contractor is busy.
      if (bookingEnd > now) {
        console.log(
          `[AVAILABILITY] ✅ Booking ${booking._id} ends at ${bookingEnd}, now is ${now}, isBusy = true`,
        );
        isBusy = true;
        break;
      } else {
        console.log(
          `[AVAILABILITY] ❌ Booking ${booking._id} ends at ${bookingEnd}, now is ${now}, already expired`,
        );
      }
    }

    // Determine the correct status
    const newAvailability = isBusy ? "Red" : "Green";
    console.log(
      `[AVAILABILITY] Calculated new availability: ${newAvailability} (isBusy=${isBusy})`,
    );

    // Get current status to see if we need to update
    console.log(
      `[AVAILABILITY] Looking up contractor ${contractorIdString} in database`,
    );
    const contractor = await Contractor.findById(contractorIdString);
    if (!contractor) {
      console.error(
        `[AVAILABILITY ERROR] Contractor ${contractorIdString} not found in database`,
      );
      return;
    }
    console.log(`[AVAILABILITY] Found contractor: ${contractor.name}`);

    const oldAvailability = contractor.availability;
    const desiredStatus = newAvailability === "Red" ? "Busy" : "Available";

    console.log(
      `[AVAILABILITY] Status comparison: Old=${oldAvailability}, New=${newAvailability}, DesiredStatus=${desiredStatus}, CurrentStatus=${contractor.availabilityStatus}`,
    );

    // Only hit the DB if the status is actually changing
    if (
      oldAvailability !== newAvailability ||
      contractor.availabilityStatus !== desiredStatus
    ) {
      console.log(
        `[AVAILABILITY] 🔄 STATUS CHANGE DETECTED - Updating contractor ${contractorIdString}`,
      );
      contractor.availability = newAvailability;
      contractor.availabilityStatus = desiredStatus;
      await contractor.save();
      console.log(
        `[AVAILABILITY] ✅ UPDATED - Contractor ${contractorIdString} changed from ${oldAvailability} to ${newAvailability}`,
      );
    } else {
      console.log(
        `[AVAILABILITY] ⏭️  No change needed for contractor ${contractorIdString}`,
      );
    }

    return newAvailability;
  } catch (error) {
    console.error("[AVAILABILITY ERROR] Unexpected error:", error);
  }
};

/**
 * SCHEDULER JOB 1: Check Active Jobs Expiry
 * Runs every minute to check "Red" contractors.
 * If their active job time has passed, this sets them to "Green".
 */
const checkActiveJobsExpiry = async () => {
  try {
    // 1. Find all contractors who are currently marked as "Busy" (Red)
    const busyContractors = await Contractor.find({
      $or: [{ availability: "Red" }, { availabilityStatus: "Busy" }],
    });

    // 2. Re-evaluate availability for each busy contractor
    for (const contractor of busyContractors) {
      await updateContractorAvailability(contractor._id);
    }
  } catch (error) {
    console.error("[Availability Scheduler Error]:", error.message);
  }
};

/**
 * SCHEDULER JOB 2: Auto-complete bookings
 * If job is "Completed" by contractor but user hasn't clicked "Satisfied" after 3 hours.
 * Contractor receives payment automatically if user fails to confirm satisfaction.
 */
const checkAndAutoCompleteBookings = async () => {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const bookingsToAutoComplete = await Booking.find({
      status: "Completed",
      userSatisfied: false,
      paymentStatus: { $in: ["Pending", "Processing"] },
      completedAt: { $lte: threeHoursAgo }, // Use completedAt to track 3 hours from when contractor marked done
    }).populate("user contractor");

    if (bookingsToAutoComplete.length > 0) {
      console.log(
        `[Auto-Complete] Found ${bookingsToAutoComplete.length} bookings to process.`,
      );
    }

    for (const booking of bookingsToAutoComplete) {
      try {
        const { adminAmount, contractorAmount } = calculateNormalPayment(
          booking.totalPrice,
        );

        // Update contractor wallet
        await Contractor.findByIdAndUpdate(booking.contractor._id, {
          $inc: { walletBalance: contractorAmount },
        });

        // Mark booking as auto-completed
        booking.userSatisfied = true;
        booking.autoCompletedAt = new Date();
        booking.paymentStatus = "Completed";
        booking.status = "Completed_And_Confirmed";
        await booking.save();

        // Update availability (Contractor might become free now)
        await updateContractorAvailability(booking.contractor._id);

        // Notifications
        await Notification.create({
          user: booking.contractor._id,
          message: `🎉 AUTO-PAYMENT RELEASED! Payment of Rs. ${contractorAmount} released for job "${booking.serviceName}" because user did not confirm within 3 hours.`,
          type: "success",
          relatedBooking: booking._id,
        });

        await Notification.create({
          user: booking.user._id,
          message: `Job \"${booking.serviceName}\" auto-confirmed and contractor payment released after 3 hours without your action.`,
          type: "info",
          relatedBooking: booking._id,
        });

        console.log(
          `[Auto-Complete] ✅ Booking ${booking._id} auto-paid - User did not confirm within 3 hours. Contractor received Rs. ${contractorAmount}`,
        );

        console.log(`[Auto-Complete] Booking ${booking._id} completed.`);
      } catch (err) {
        console.error(
          `[Auto-Complete Error] Booking ${booking._id}: ${err.message}`,
        );
      }
    }
  } catch (error) {
    console.error("[Auto-Complete Scheduler Error]:", error.message);
  }
};

/**
 * SCHEDULER JOB 3: Refund Incomplete Jobs
 * If contractor fails to mark job "Completed" within agreed time.
 */
const checkAndRefundIncompleteJobs = async () => {
  try {
    const now = new Date();

    const incompleteBookings = await Booking.find({
      status: "Active",
      completedBy: { $lte: now }, // Deadline passed
      completedAt: null,
    }).populate("user contractor");

    if (incompleteBookings.length > 0) {
      console.log(
        `[Incomplete Jobs] Found ${incompleteBookings.length} to refund.`,
      );
    }

    for (const booking of incompleteBookings) {
      try {
        booking.status = "Incomplete";
        booking.paymentStatus = "Refunded";
        booking.incompleteRefundedAt = new Date();
        await booking.save();

        // Update availability
        await updateContractorAvailability(booking.contractor._id);

        // Refund user
        await User.findByIdAndUpdate(booking.user._id, {
          $inc: { walletBalance: booking.totalPrice },
        });

        // Notifications
        await Notification.create({
          user: booking.user._id,
          message: `Job "${booking.serviceName}" incomplete. Full refund of Rs. ${booking.totalPrice} credited.`,
          type: "refund",
          relatedBooking: booking._id,
        });

        await Notification.create({
          user: booking.contractor._id,
          message: `Job "${booking.serviceName}" marked incomplete (deadline missed). User refunded.`,
          type: "warning",
          relatedBooking: booking._id,
        });

        console.log(`[Incomplete Refund] Booking ${booking._id} refunded.`);
      } catch (err) {
        console.error(
          `[Incomplete Refund Error] Booking ${booking._id}: ${err.message}`,
        );
      }
    }
  } catch (error) {
    console.error("[Incomplete Refund Scheduler Error]:", error.message);
  }
};

/**
 * 4. Auto-cancel Pending Requests older than 24 hours
 */
const checkAndCancelExpiredBookings = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Booking.updateMany(
      { status: "Pending_Approval", createdAt: { $lt: twentyFourHoursAgo } },
      { status: "Cancelled" },
    );
    if (result.modifiedCount > 0) {
      console.log(
        `[Scheduler] Cancelled ${result.modifiedCount} expired pending bookings.`,
      );
    }
  } catch (error) {
    console.error("[Scheduler Error] checkAndCancelExpiredBookings:", error);
  }
};

/**
 * 5. Check for expired contractor acceptance timeouts
 * If contractor doesn't accept/reject within time limit (30 min emergency, 60 min normal),
 * expire the booking and notify the user to find a new contractor
 */
const checkExpiredContractorAcceptance = async () => {
  try {
    const now = new Date();

    const expiredBookings = await Booking.find({
      status: "Pending_Contractor_Approval",
      acceptanceExpiresAt: { $lte: now },
      acceptanceExpired: false,
    }).populate("user contractor");

    if (expiredBookings.length > 0) {
      console.log(
        `[Contractor Acceptance Timeout] Found ${expiredBookings.length} expired bookings.`,
      );
    }

    for (const booking of expiredBookings) {
      try {
        // Mark booking as expired
        booking.status = "Cancelled";
        booking.acceptanceExpired = true;
        await booking.save();

        // Notify user to find a new contractor
        await Notification.create({
          user: booking.user._id,
          message: `Contractor did not respond to your job request "${booking.serviceName}" in time. Please find a new contractor.`,
          type: "warning",
          relatedBooking: booking._id,
        });

        // Notify contractor that they missed the opportunity
        await Notification.create({
          user: booking.contractor._id,
          message: `You failed to respond to job request "${booking.serviceName}" within the required time. The booking has been cancelled.`,
          type: "warning",
          relatedBooking: booking._id,
        });

        console.log(
          `[Contractor Acceptance Timeout] Booking ${booking._id} expired and cancelled.`,
        );
      } catch (err) {
        console.error(
          `[Contractor Acceptance Timeout Error] Booking ${booking._id}: ${err.message}`,
        );
      }
    }
  } catch (error) {
    console.error(
      "[Contractor Acceptance Timeout Scheduler Error]:",
      error.message,
    );
  }
};

/**
 * 6. Check for expired payment uploads
 * If user doesn't upload payment within 2 hours after contractor accepts,
 * cancel the booking and notify both parties
 */
const checkExpiredPaymentUploads = async () => {
  try {
    const now = new Date();

    const expiredPayments = await Booking.find({
      status: "Payment_Pending",
      paymentExpiresAt: { $lte: now },
      paymentExpired: false,
    }).populate("user contractor");

    if (expiredPayments.length > 0) {
      console.log(
        `[Payment Upload Timeout] Found ${expiredPayments.length} expired payment uploads.`,
      );
    }

    for (const booking of expiredPayments) {
      try {
        // Mark booking as expired and cancelled
        booking.status = "Cancelled";
        booking.paymentExpired = true;
        await booking.save();

        // Free up contractor availability
        await updateContractorAvailability(booking.contractor._id);

        // Notify user that booking was cancelled due to payment timeout
        await Notification.create({
          user: booking.user._id,
          message: `Your booking "${booking.serviceName}" has EXPIRED! Payment proof was not uploaded within 2 hours. The job has been cancelled and contractor has been notified. Please create a new booking if you still need this service.`,
          type: "error",
          relatedBooking: booking._id,
        });

        // Notify contractor that user failed to pay
        await Notification.create({
          user: booking.contractor._id,
          message: `Job "${booking.serviceName}" has EXPIRED! The user failed to upload payment proof within 2 hours. The booking has been cancelled. You are now available for other jobs.`,
          type: "error",
          relatedBooking: booking._id,
        });

        console.log(
          `[Payment Upload Timeout] ✅ Booking ${booking._id} EXPIRED - User did not pay within 2 hours. Contractor notified.`,
        );
      } catch (err) {
        console.error(
          `[Payment Upload Timeout Error] Booking ${booking._id}: ${err.message}`,
        );
      }
    }
  } catch (error) {
    console.error(
      "[Payment Upload Timeout Scheduler Error]:",
      error.message,
    );
  }
};

module.exports = {
  checkAndAutoCompleteBookings,
  checkAndRefundIncompleteJobs,
  updateContractorAvailability,
  checkActiveJobsExpiry,
  checkAndCancelExpiredBookings,
  checkExpiredContractorAcceptance,
  checkExpiredPaymentUploads,
};
