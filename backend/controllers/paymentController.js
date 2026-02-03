const Booking = require("../models/Booking");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { updateContractorAvailability } = require("../utils/bookingScheduler");

// @desc    Admin Manually Verifies Payment Screenshot
// @route   PUT /api/payments/:bookingId/verify
const verifyPayment = async (req, res) => {
  const { decision, comment } = req.body;

  try {
    const booking = await Booking.findById(req.params.bookingId).populate(
      "user contractor",
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (decision === "approve") {
      booking.status = "Active"; // JOB STARTS NOW
      booking.paymentStatus = "Held"; // Money is held by Admin
      booking.phoneNumbersVisible = true; // Allow contact number sharing after admin approval

      // LOGIC: Recalculate end time based on actual approval time
      const now = new Date();
      const newEndTime = new Date(now);
      // Use totalDuration if available, fallback to bookingHours, default to 1 hour
      const durationHours = booking.totalDuration || booking.bookingHours || 1;
      const durationDays = booking.bookingDays || 1;

      newEndTime.setHours(newEndTime.getHours() + durationHours);
      newEndTime.setDate(newEndTime.getDate() + durationDays - 1);

      booking.booking_start_time = "09:00";
      booking.booking_end_time = newEndTime;

      // ✅ CRITICAL FIX: Also update the 'completedBy' deadline!
      // Without this, the scheduler thinks the deadline passed days ago.
      booking.completedBy = newEndTime;

      console.log(
        `[PAYMENT VERIFICATION] Booking ${booking._id}: status=Active, durationHours=${durationHours}, endTime=${newEndTime}, contractorId=${booking.contractor}`,
      );

      // Save booking first so updateContractorAvailability can find the Active status
      await booking.save();

      console.log(
        `[PAYMENT VERIFICATION] Booking saved, now updating contractor availability`,
      );

      // Update Contractor to BUSY
      await updateContractorAvailability(booking.contractor);

      console.log(`[PAYMENT VERIFICATION] Contractor availability updated`);

      // Notify
      await Notification.create({
        user: booking.contractor,
        message: `New Job Active! Payment verified by Admin. Start work for ${booking.serviceName}.`,
        type: "job_start",
        relatedBooking: booking._id,
      });
    } else {
      booking.status = "Rejected_Payment";
      booking.paymentStatus = "Pending"; // Reset to allow re-upload

      // Save the rejected status
      await booking.save();

      // Notify User
      await Notification.create({
        user: booking.user,
        message: `Payment Rejected: ${comment || "Invalid Screenshot"}. Please upload valid proof.`,
        type: "alert",
        relatedBooking: booking._id,
      });

      // Notify Contractor about payment rejection
      await Notification.create({
        user: booking.contractor,
        message: `Payment Rejected by Admin for ${booking.serviceName}. Waiting for customer to reupload payment proof.`,
        type: "alert",
        relatedBooking: booking._id,
      });

      // ✅ NOTIFY all admins about payment rejection
      const admins = await User.find({ role: "admin" });
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        message: `Payment Rejected: ${booking.serviceName} - ${comment || "Invalid screenshot"}`,
        type: "alert",
        relatedBooking: booking._id,
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

module.exports = { verifyPayment };
