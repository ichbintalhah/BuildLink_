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

const getMilestoneWorkflowState = (milestone) => {
  if (!milestone) return "pending_payment";
  if (milestone.workflowState) return milestone.workflowState;
  if (milestone.completedAt) return "completed";
  if (milestone.status === "paid") return "approved";
  return "pending_payment";
};

const isReleasedMilestone = (milestone) => {
  const state = getMilestoneWorkflowState(milestone);
  return ["approved", "auto_released"].includes(state) || milestone?.status === "paid";
};

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
      // Use completedBy (actual work deadline) first, then fall back to booking_end_time or endDate
      const bookingEnd = new Date(
        booking.completedBy || booking.booking_end_time || booking.endDate,
      );

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

    // Check for heavy-duty construction bookings in intermediate milestone states
    // (between milestones the status changes to Payment_Pending/Verification_Pending/Completed
    //  but the contractor is still engaged and should remain Busy)
    if (!isBusy) {
      const heavyDutyInProgress = await Booking.find({
        contractor: contractorIdString,
        bookingType: "heavy-duty-construction",
        status: {
          $in: ["Payment_Pending", "Verification_Pending", "Completed"],
        },
      });

      for (const booking of heavyDutyInProgress) {
        // Only consider it "in progress" if at least one milestone has been paid
        // (to avoid marking busy before work has even started for first-time Payment_Pending)
        const hasStartedWork =
          booking.paymentSchedule &&
          booking.paymentSchedule.some(
            (m) => m.status === "paid" || m.completedAt,
          );
        if (hasStartedWork) {
          console.log(
            `[AVAILABILITY] ✅ Heavy-duty booking ${booking._id} is between milestones (status=${booking.status}), contractor still engaged, isBusy = true`,
          );
          isBusy = true;
          break;
        }
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
        `[AVAILABILITY] STATUS CHANGE DETECTED - Updating contractor ${contractorIdString}`,
      );
      contractor.availability = newAvailability;
      contractor.availabilityStatus = desiredStatus;
      await contractor.save();
      console.log(
        `[AVAILABILITY] UPDATED - Contractor ${contractorIdString} changed from ${oldAvailability} to ${newAvailability}`,
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
          message: `AUTO-PAYMENT RELEASED! Payment of Rs. ${contractorAmount} released for job "${booking.serviceName}" because user did not confirm within 3 hours.`,
          type: "success",
          relatedBooking: booking._id,
          notifCategory: "auto_complete",
        });

        await Notification.create({
          user: booking.user._id,
          message: `Job "${booking.serviceName}" auto-confirmed and contractor payment released after 3 hours without your action.`,
          type: "info",
          relatedBooking: booking._id,
          notifCategory: "auto_complete",
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
          notifCategory: "refund",
        });

        await Notification.create({
          user: booking.contractor._id,
          message: `Job "${booking.serviceName}" marked incomplete (deadline missed). User refunded.`,
          type: "warning",
          relatedBooking: booking._id,
          notifCategory: "refund",
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
          notifCategory: "acceptance_expired",
        });

        // Notify contractor that they missed the opportunity
        await Notification.create({
          contractor: booking.contractor._id,
          message: `You failed to respond to job request "${booking.serviceName}" within the required time. The booking has been cancelled.`,
          type: "warning",
          relatedBooking: booking._id,
          notifCategory: "acceptance_expired",
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
        const isHeavyDuty =
          booking.bookingType === "heavy-duty-construction" &&
          Array.isArray(booking.paymentSchedule) &&
          booking.paymentSchedule.length > 0;

        // Mark booking as expired and locked due to non-payment.
        booking.status = "Expired_Non_Payment";
        booking.paymentExpired = true;
        booking.paymentExpiresAt = null;

        if (isHeavyDuty) {
          const idx = booking.currentMilestone || 0;
          booking.paymentSchedule = booking.paymentSchedule.map((m, i) => {
            const obj = m.toObject ? m.toObject() : { ...m };
            if (i === idx) {
              obj.workflowState = "expired_non_payment";
              obj.milestoneStartDate = null;
              obj.milestoneDeadline = null;
            }
            return obj;
          });
          booking.markModified("paymentSchedule");
        }
        await booking.save();

        // Free up contractor availability
        await updateContractorAvailability(booking.contractor._id);

        // Notify user that booking was cancelled due to payment timeout
        await Notification.create({
          user: booking.user._id,
          message: isHeavyDuty
            ? `Your booking "${booking.serviceName}" has expired due to non-payment. Required milestone escrow payment was not uploaded within 2 hours. The project is now locked.`
            : `Your booking "${booking.serviceName}" has expired due to non-payment. Payment proof was not uploaded within 2 hours. The project is now locked.`,
          type: "error",
          relatedBooking: booking._id,
          notifCategory: "payment_expired",
        });

        // Notify contractor that user failed to pay
        await Notification.create({
          contractor: booking.contractor._id,
          message: isHeavyDuty
            ? `Job "${booking.serviceName}" expired due to non-payment. The user failed to upload the next milestone escrow payment within 2 hours. The project is now locked and no further work is required from you.`
            : `Job "${booking.serviceName}" expired due to non-payment. The user failed to upload payment proof within 2 hours. The project is now locked and no further work is required from you.`,
          type: "error",
          relatedBooking: booking._id,
          notifCategory: "payment_expired",
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
    console.error("[Payment Upload Timeout Scheduler Error]:", error.message);
  }
};

/**
 * 7. Check for expired heavy duty construction milestone deadlines
 * If contractor doesn't upload milestone completion images by milestone deadline,
 * refund the user the remaining amount
 */
const checkExpiredMilestoneDeadlines = async () => {
  try {
    const now = new Date();

    // Find all active heavy duty construction bookings
    const heavyDutyBookings = await Booking.find({
      bookingType: "heavy-duty-construction",
      status: "Active",
      paymentSchedule: { $exists: true, $ne: [] },
    }).populate("user contractor");

    if (heavyDutyBookings.length === 0) return;

    console.log(
      `[Milestone Deadline Check] Checking ${heavyDutyBookings.length} heavy duty construction bookings...`,
    );

    for (const booking of heavyDutyBookings) {
      try {
        const currentMilestoneIndex = booking.currentMilestone || 0;
        const currentMilestone = booking.paymentSchedule[currentMilestoneIndex];

        if (!currentMilestone) continue; // All milestones completed

        const workflowState = getMilestoneWorkflowState(currentMilestone);
        const isWorkWindowActive =
          ["funded", "in_progress"].includes(workflowState) ||
          (currentMilestone.status === "paid" && !currentMilestone.completedAt);
        if (!isWorkWindowActive) continue;

        // Check if milestone deadline has passed and no completion images uploaded
        if (
          currentMilestone.milestoneDeadline &&
          new Date(currentMilestone.milestoneDeadline) <= now &&
          (!currentMilestone.completionImages ||
            currentMilestone.completionImages.length === 0) &&
          !currentMilestone.completedAt
        ) {
          console.log(
            `[Milestone Deadline] Booking ${booking._id} - Milestone ${currentMilestoneIndex + 1} deadline passed without completion images.`,
          );

          // Calculate total amount paid so far
          let totalPaidAmount = 0;
          for (let i = 0; i < currentMilestoneIndex; i++) {
            if (isReleasedMilestone(booking.paymentSchedule[i])) {
              totalPaidAmount += booking.paymentSchedule[i].amount;
            }
          }

          // Calculate refund amount (total price - amount already paid)
          const refundAmount = booking.totalPrice - totalPaidAmount;

          // Mark booking as incomplete and refund user
          booking.status = "Incomplete";
          booking.paymentStatus = "Refunded";
          booking.incompleteRefundedAt = new Date();
          await booking.save();

          // Update contractor availability
          await updateContractorAvailability(booking.contractor._id);

          // Refund user the remaining amount
          if (refundAmount > 0) {
            await User.findByIdAndUpdate(booking.user._id, {
              $inc: { walletBalance: refundAmount },
            });
          }

          // Notify user
          await Notification.create({
            user: booking.user._id,
            message: `Heavy Duty Construction job "${booking.serviceName}" incomplete. Contractor failed to upload milestone ${currentMilestoneIndex + 1} completion images by deadline. Refund of Rs. ${refundAmount} credited to your wallet.`,
            type: "refund",
            relatedBooking: booking._id,
            notifCategory: "milestone_expired",
          });

          // Notify contractor
          await Notification.create({
            contractor: booking.contractor._id,
            message: `Heavy Duty Construction job "${booking.serviceName}" marked incomplete. You failed to upload milestone ${currentMilestoneIndex + 1} completion images by deadline. User has been refunded.`,
            type: "warning",
            relatedBooking: booking._id,
            notifCategory: "milestone_expired",
          });

          console.log(
            `[Milestone Deadline] Booking ${booking._id} refunded Rs. ${refundAmount}. Total paid: Rs. ${totalPaidAmount}`,
          );
        }
      } catch (err) {
        console.error(
          `[Milestone Deadline Error] Booking ${booking._id}: ${err.message}`,
        );
      }
    }
  } catch (error) {
    console.error("[Milestone Deadline Scheduler Error]:", error.message);
  }
};

/**
 * SCHEDULER JOB 8: Auto-approve milestones after 3 hours if user doesn't respond
 * When contractor submits milestone completion, user has 3 hours to approve/dispute.
 * If user doesn't respond, auto-approve and release payment to contractor.
 */
const checkExpiredMilestoneSatisfaction = async () => {
  try {
    const now = new Date();

    // Find bookings with heavy duty construction that have milestones pending user satisfaction
    const bookingsWithExpiredSatisfaction = await Booking.find({
      bookingType: "heavy-duty-construction",
      status: "Active",
    }).populate("user contractor");

    if (
      !bookingsWithExpiredSatisfaction ||
      bookingsWithExpiredSatisfaction.length === 0
    ) {
      return;
    }

    for (const booking of bookingsWithExpiredSatisfaction) {
      try {
        const currentMilestoneIndex = booking.currentMilestone || 0;
        const currentMilestone = booking.paymentSchedule[currentMilestoneIndex];

        // Check if current milestone is completed and has expired satisfaction deadline
        // Milestone has completedAt (contractor submitted work) and satisfactionDeadline that has expired
        if (
          currentMilestone &&
          currentMilestone.completedAt &&
          currentMilestone.satisfactionDeadline &&
          currentMilestone.satisfactionDeadline <= now
        ) {
          console.log(
            `[Milestone Auto-Approve] Processing booking ${booking._id}, milestone ${currentMilestoneIndex + 1}`,
          );

          const milestoneAmount = currentMilestone.amount;
          const { contractorAmount } = calculateNormalPayment(milestoneAmount);

          // Release payment to contractor
          await Contractor.findByIdAndUpdate(booking.contractor._id, {
            $inc: { walletBalance: contractorAmount },
          });

          // Check if this is the last milestone
          const isLastMilestone =
            currentMilestoneIndex === booking.paymentSchedule.length - 1;

          // Update milestone status and clear satisfaction deadline
          const updatedSchedule = booking.paymentSchedule.map((m, idx) => {
            const obj = m.toObject ? m.toObject() : { ...m };
            if (idx === currentMilestoneIndex) {
              obj.satisfactionDeadline = null;
              obj.workflowState = "auto_released";
              // Keep legacy status for compatibility with existing UI.
              obj.status = "paid";
              obj.releasedAt = now;
              obj.autoReleasedAt = now;
            }
            return obj;
          });
          booking.paymentSchedule = updatedSchedule;
          booking.markModified("paymentSchedule");

          if (isLastMilestone) {
            // Final milestone - complete the job
            booking.status = "Completed_And_Confirmed";
            booking.paymentStatus = "Completed";
            booking.userSatisfied = true;
            booking.autoCompletedAt = new Date();
            booking.completedAt = new Date();

            await Notification.create({
              contractor: booking.contractor._id,
              message: `AUTO-PAYMENT RELEASED! Final payment of Rs. ${contractorAmount} (after 5% admin fee) released for "${booking.serviceName}" because user did not respond within 3 hours.`,
              type: "success",
              relatedBooking: booking._id,
              notifCategory: "auto_complete",
            });

            await Notification.create({
              user: booking.user._id,
              message: `Final milestone for "${booking.serviceName}" auto-confirmed after 3 hours. Payment of Rs. ${contractorAmount} released to contractor.`,
              type: "info",
              relatedBooking: booking._id,
              notifCategory: "auto_complete",
            });

            // Update contractor availability (job completely done)
            await updateContractorAvailability(booking.contractor._id);

            console.log(
              `[Milestone Auto-Approve] ✅ Final milestone auto-approved for booking ${booking._id}. Contractor received Rs. ${contractorAmount}`,
            );
          } else {
            // Not the last milestone - move to next milestone
            booking.currentMilestone = currentMilestoneIndex + 1;
            const nextMilestone =
              booking.paymentSchedule[currentMilestoneIndex + 1];

            // Keep next milestone blocked until escrow is funded.
            const updatedScheduleWithNext = booking.paymentSchedule.map(
              (m, idx) => {
                const obj = m.toObject ? m.toObject() : { ...m };
                if (idx === currentMilestoneIndex + 1) {
                  obj.workflowState = "pending_payment";
                  obj.milestoneDeadline = null;
                  obj.milestoneStartDate = null;
                  obj.satisfactionDeadline = null;
                  obj.completedAt = null;
                  obj.completionImages = [];
                  obj.paymentScreenshot = null;
                  obj.paymentVerifiedAt = null;
                  obj.releasedAt = null;
                  obj.autoReleasedAt = null;
                  obj.status = "pending";
                }
                return obj;
              },
            );
            booking.paymentSchedule = updatedScheduleWithNext;
            booking.markModified("paymentSchedule");

            booking.status = "Payment_Pending";
            booking.paymentExpired = false;
            booking.paymentExpiresAt = new Date(
              Date.now() + 2 * 60 * 60 * 1000,
            );

            await Notification.create({
              contractor: booking.contractor._id,
              message: `AUTO-PAYMENT RELEASED! Payment of Rs. ${contractorAmount} (after 5% admin fee) for milestone ${currentMilestoneIndex + 1} released for "${booking.serviceName}". Next milestone will start only after escrow payment is funded.`,
              type: "success",
              relatedBooking: booking._id,
              notifCategory: "auto_complete",
            });

            await Notification.create({
              user: booking.user._id,
              message: `Milestone ${currentMilestoneIndex + 1} for "${booking.serviceName}" auto-confirmed after 3 hours. Payment of Rs. ${contractorAmount} released. Upload escrow payment for milestone ${currentMilestoneIndex + 2} within 2 hours to continue.`,
              type: "info",
              relatedBooking: booking._id,
              notifCategory: "auto_complete",
            });

            console.log(
              `[Milestone Auto-Approve] ✅ Milestone ${currentMilestoneIndex + 1} auto-approved for booking ${booking._id}. Moving to milestone ${currentMilestoneIndex + 2}`,
            );
          }

          await booking.save();
        }
      } catch (err) {
        console.error(
          `[Milestone Auto-Approve Error] Booking ${booking._id}: ${err.message}`,
        );
      }
    }
  } catch (error) {
    console.error("[Milestone Satisfaction Scheduler Error]:", error.message);
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
  checkExpiredMilestoneDeadlines, // NEW: Add milestone deadline checker
  checkExpiredMilestoneSatisfaction, // NEW: Add milestone satisfaction checker
};
