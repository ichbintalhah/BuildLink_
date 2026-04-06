const Booking = require("../models/Booking");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { updateContractorAvailability } = require("../utils/bookingScheduler");

const getMilestoneWorkflowState = (milestone) => {
  if (!milestone) return "pending_payment";
  if (milestone.workflowState) return milestone.workflowState;
  if (milestone.completedAt) return "completed";
  if (milestone.status === "paid") return "approved";
  return "pending_payment";
};

const normalizePaymentDecision = (booking) => {
  const explicitStatus = booking.paymentVerificationStatus;
  if (explicitStatus === "Approved") return "Approved";
  if (explicitStatus === "Rejected") return "Rejected";
  if (booking.status === "Rejected_Payment") return "Rejected";

  if (
    ["Held", "Completed", "Disputed", "Refunded", "Processing"].includes(
      booking.paymentStatus,
    ) ||
    ["Active", "Completed", "Completed_And_Confirmed", "Disputed"].includes(
      booking.status,
    )
  ) {
    return "Approved";
  }

  return "Pending";
};

// @desc    Admin Manually Verifies Payment Screenshot
// @route   PUT /api/payments/:bookingId/verify
const verifyPayment = async (req, res) => {
  const { decision, comment } = req.body;

  try {
    const booking = await Booking.findById(req.params.bookingId).populate(
      "user contractor",
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "Expired_Non_Payment" || booking.paymentExpired) {
      return res.status(409).json({
        message:
          "This project is expired due to non-payment and is locked. No further actions are allowed.",
      });
    }

    if (decision === "approve") {
      booking.status = "Active"; // JOB STARTS NOW
      booking.paymentStatus = "Held"; // Money is held by Admin
      booking.phoneNumbersVisible = true; // Allow contact number sharing after admin approval

      // Check if it's a heavy duty construction booking
      const isHeavyDuty = booking.bookingType === "heavy-duty-construction";
      const currentMilestoneIndex = booking.currentMilestone || 0;
      const currentMilestone = isHeavyDuty
        ? booking.paymentSchedule?.[currentMilestoneIndex]
        : null;
      const paymentAmount =
        isHeavyDuty && currentMilestone?.amount
          ? currentMilestone.amount
          : booking.totalPrice;

      booking.paymentVerificationStatus = "Approved";
      booking.paymentVerifiedAt = new Date();
      booking.paymentVerifiedBy = req.user._id;
      booking.paymentRejectionReason = "";
      booking.paymentDecisionAmount = paymentAmount;
      booking.paymentDecisionMilestoneNumber = isHeavyDuty
        ? currentMilestoneIndex + 1
        : null;

      // LOGIC: Recalculate end time based on actual approval time
      const now = new Date();
      const newEndTime = new Date(now);

      if (isHeavyDuty && booking.endDate) {
        const workflowState = getMilestoneWorkflowState(currentMilestone);
        if (!currentMilestone?.paymentScreenshot) {
          return res.status(400).json({
            message:
              "Current milestone has no payment proof. User must upload escrow payment first.",
          });
        }
        if (
          currentMilestone &&
          !["payment_submitted", "pending_payment"].includes(workflowState)
        ) {
          return res.status(409).json({
            message:
              "Current milestone is not waiting for escrow verification.",
          });
        }

        // For heavy duty construction, use the actual project end date
        newEndTime.setTime(booking.endDate.getTime());

        // Set booking_end_time so availability scheduler can track it
        booking.booking_end_time = new Date(booking.endDate);

        // Set completedBy to the actual project end date
        booking.completedBy = new Date(booking.endDate);

        // Start timer for current milestone only after funding is verified.
        if (booking.paymentSchedule && booking.paymentSchedule.length > 0) {
          const prevMilestone = booking.paymentSchedule[currentMilestoneIndex - 1];
          const currentDays = Number(currentMilestone?.daysCompleted || 0);
          const previousDays = Number(prevMilestone?.daysCompleted || 0);
          const requiredDays =
            currentMilestoneIndex === 0
              ? Math.max(currentDays || 2, 1)
              : Math.max(currentDays - previousDays, 1);

          const newStartDate = new Date(now);
          const newDeadline = new Date(now);
          newDeadline.setDate(now.getDate() + requiredDays);

          const updatedSchedule = booking.paymentSchedule.map((m, idx) => {
            const obj = m.toObject ? m.toObject() : { ...m };
            if (idx === currentMilestoneIndex) {
              obj.milestoneStartDate = newStartDate;
              obj.milestoneDeadline = newDeadline;
              obj.paymentVerifiedAt = new Date(now);
              obj.status = "paid";
              obj.workflowState = "in_progress";
            }
            return obj;
          });
          booking.paymentSchedule = updatedSchedule;

          console.log(
            `[PAYMENT VERIFICATION] Milestone ${currentMilestoneIndex + 1} funded and started: startDate=${newStartDate}, deadline=${newDeadline}, requiredDays=${requiredDays}`,
          );
        }

        // Ensure Mongoose detects paymentSchedule changes
        booking.markModified("paymentSchedule");

        console.log(
          `[PAYMENT VERIFICATION] Heavy Duty Construction Booking ${booking._id}: endDate=${booking.endDate}, completedBy=${booking.completedBy}`,
        );
      } else {
        // Regular booking: use totalDuration/bookingHours
        const durationHours =
          booking.totalDuration || booking.bookingHours || 1;
        const durationDays = booking.bookingDays || 1;

        // Calculate the work deadline from NOW (admin approval time)
        // so the scheduler knows when the contractor must finish
        newEndTime.setHours(newEndTime.getHours() + durationHours);
        newEndTime.setDate(newEndTime.getDate() + durationDays - 1);

        // ✅ PRESERVE original booking_start_time and booking_end_time
        // These are the user's chosen schedule times and should NOT be overwritten.
        // Only update completedBy which is the actual work deadline for the scheduler.
        booking.completedBy = newEndTime;

        console.log(
          `[PAYMENT VERIFICATION] Regular Booking ${booking._id}: status=Active, durationHours=${durationHours}, completedBy=${newEndTime}, original_start=${booking.booking_start_time}, original_end=${booking.booking_end_time}`,
        );
      }

      console.log(
        `[PAYMENT VERIFICATION] Booking ${booking._id}: status=Active, contractorId=${booking.contractor}`,
      );

      // Save booking first so updateContractorAvailability can find the Active status
      await booking.save();

      console.log(
        `[PAYMENT VERIFICATION] Booking saved, now updating contractor availability`,
      );

      // Update Contractor to BUSY
      await updateContractorAvailability(booking.contractor);

      console.log(`[PAYMENT VERIFICATION] Contractor availability updated`);

      // Notify Contractor
      await Notification.create({
        contractor: booking.contractor._id,
        message: isHeavyDuty
          ? `✅ Payment Approved! Heavy Duty Construction job "${booking.serviceName}" is now Active. Go to work! Milestone payment: Rs. ${paymentAmount}`
          : `New Job Active! Payment verified by Admin. Start work for ${booking.serviceName}.`,
        type: "job_start",
        relatedBooking: booking._id,
        notifCategory: "payment_approved",
      });

      // Notify User
      await Notification.create({
        user: booking.user._id,
        message: isHeavyDuty
          ? `✅ Payment Approved! Your Heavy Duty Construction booking "${booking.serviceName}" is now Active. Milestone payment Rs. ${paymentAmount} verified.`
          : `Payment Approved! Your booking for ${booking.serviceName} is now Active.`,
        type: "success",
        relatedBooking: booking._id,
        notifCategory: "payment_approved",
      });
    } else {
      booking.status = "Rejected_Payment";
      booking.paymentStatus = "Pending"; // Reset to allow re-upload

      const isHeavyDuty = booking.bookingType === "heavy-duty-construction";
      const currentMilestoneIndex = booking.currentMilestone || 0;
      const currentMilestone = isHeavyDuty
        ? booking.paymentSchedule?.[currentMilestoneIndex]
        : null;
      const rejectedAmount =
        isHeavyDuty && currentMilestone?.amount
          ? currentMilestone.amount
          : booking.totalPrice;

      booking.paymentVerificationStatus = "Rejected";
      booking.paymentVerifiedAt = new Date();
      booking.paymentVerifiedBy = req.user._id;
      booking.paymentRejectionReason = comment || "Invalid Screenshot";
      booking.paymentDecisionAmount = rejectedAmount;
      booking.paymentDecisionMilestoneNumber = isHeavyDuty
        ? currentMilestoneIndex + 1
        : null;

      if (
        booking.bookingType === "heavy-duty-construction" &&
        booking.paymentSchedule?.length > 0
      ) {
        const idx = booking.currentMilestone || 0;
        booking.paymentSchedule = booking.paymentSchedule.map((m, i) => {
          const obj = m.toObject ? m.toObject() : { ...m };
          if (i === idx) {
            obj.workflowState = "pending_payment";
            obj.paymentScreenshot = null;
            obj.paymentVerifiedAt = null;
            obj.milestoneStartDate = null;
            obj.milestoneDeadline = null;
          }
          return obj;
        });
        booking.markModified("paymentSchedule");
      }

      // Save the rejected status
      await booking.save();

      // Notify User
      await Notification.create({
        user: booking.user._id,
        message: isHeavyDuty
          ? `Payment Rejected for Heavy Duty Construction: ${comment || "Invalid Screenshot"}. Please upload valid payment proof.`
          : `Payment Rejected: ${comment || "Invalid Screenshot"}. Please upload valid proof.`,
        type: "alert",
        relatedBooking: booking._id,
        notifCategory: "payment_rejected",
      });

      // Notify Contractor about payment rejection
      await Notification.create({
        contractor: booking.contractor._id,
        message: isHeavyDuty
          ? `Payment Rejected by Admin for Heavy Duty Construction: ${booking.serviceName}. Waiting for customer to reupload payment proof.`
          : `Payment Rejected by Admin for ${booking.serviceName}. Waiting for customer to reupload payment proof.`,
        type: "alert",
        relatedBooking: booking._id,
        notifCategory: "payment_rejected",
      });

      // ✅ NOTIFY all admins about payment rejection
      const admins = await User.find({ role: "admin" });
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        message: `Payment Rejected: ${booking.serviceName} - ${comment || "Invalid screenshot"}`,
        type: "alert",
        relatedBooking: booking._id,
        notifCategory: "payment_rejected",
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }
    }

    res.json({ message: `Payment ${decision} successfully`, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment verification history for admin
// @route   GET /api/payments/admin/history
const getAdminPaymentHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { paymentVerificationStatus: { $in: ["Approved", "Rejected"] } },
        { status: "Rejected_Payment" },
        {
          paymentStatus: {
            $in: ["Held", "Completed", "Disputed", "Refunded", "Processing"],
          },
        },
      ],
    })
      .populate("user", "fullName email")
      .populate("contractor", "fullName email")
      .populate("paymentVerifiedBy", "fullName email")
      .sort({ updatedAt: -1 })
      .limit(300);

    const history = bookings.map((booking) => {
      const decision = normalizePaymentDecision(booking);
      const isHeavyDuty = booking.bookingType === "heavy-duty-construction";

      return {
        _id: booking._id,
        bookingId: booking._id,
        decision,
        decisionAt: booking.paymentVerifiedAt || booking.updatedAt,
        decidedBy: booking.paymentVerifiedBy || null,
        comment: booking.paymentRejectionReason || "",
        amount: booking.paymentDecisionAmount || booking.totalPrice || 0,
        serviceName: booking.serviceName,
        bookingType: booking.bookingType,
        jobTypeLabel: isHeavyDuty
          ? "Heavy-duty construction (milestones)"
          : "Normal construction",
        milestoneNumber: booking.paymentDecisionMilestoneNumber || null,
        milestoneTotal: isHeavyDuty
          ? booking.paymentSchedule?.length || 0
          : null,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.status,
        user: booking.user
          ? {
            _id: booking.user._id,
            fullName: booking.user.fullName,
            email: booking.user.email,
          }
          : null,
        contractor: booking.contractor
          ? {
            _id: booking.contractor._id,
            fullName: booking.contractor.fullName,
            email: booking.contractor.email,
          }
          : null,
      };
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { verifyPayment, getAdminPaymentHistory };
