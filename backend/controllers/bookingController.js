const Booking = require("../models/Booking");
const User = require("../models/User");
const Contractor = require("../models/Contractor");
const Notification = require("../models/Notification");
const Review = require("../models/Review");
const { calculateNormalPayment } = require("../utils/paymentService");
const { updateContractorAvailability } = require("../utils/bookingScheduler");

// @desc    Create a new Booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const {
      contractorId,
      serviceName,
      scheduledDate,
      booking_start_time,
      bookingHours,
      bookingDays,
      totalDuration,
      totalPrice,
      isEmergency,
    } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ message: "Scheduled date is required" });
    }

    const endDate = new Date(scheduledDate);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid Date Format" });
    }

    // Handle both old format (bookingHours/bookingDays) and new format (totalDuration)
    let calculatedEndDate = new Date(endDate);
    let bookingEndTime = null;
    let finalTotalDuration = totalDuration;

    if (totalDuration) {
      // New format: use totalDuration (in hours)
      calculatedEndDate = new Date(scheduledDate);

      // If we have a start time, construct proper end datetime
      if (booking_start_time) {
        const [startHours, startMins] = booking_start_time
          .split(":")
          .map(Number);
        calculatedEndDate.setHours(
          startHours + Math.ceil(totalDuration),
          startMins,
          0,
        );
        bookingEndTime = new Date(calculatedEndDate);
      } else {
        calculatedEndDate.setHours(
          calculatedEndDate.getHours() + Math.ceil(totalDuration),
        );
        bookingEndTime = new Date(calculatedEndDate);
      }
      finalTotalDuration = Math.ceil(totalDuration);
    } else {
      // Old format: calculate from bookingHours and bookingDays
      calculatedEndDate.setHours(
        calculatedEndDate.getHours() + parseInt(bookingHours || 1),
      );
      calculatedEndDate.setDate(
        calculatedEndDate.getDate() + (parseInt(bookingDays || 1) - 1),
      );
      bookingEndTime = new Date(calculatedEndDate);
      finalTotalDuration = parseInt(bookingHours || 1);
    }

    // Calculate acceptance expiration time
    const now = new Date();
    const acceptanceExpiresAt = new Date(
      now.getTime() + (isEmergency ? 30 : 60) * 60 * 1000
    ); // 30 minutes for emergency, 60 minutes for normal

    const booking = await Booking.create({
      user: req.user._id,
      contractor: contractorId,
      serviceName,
      scheduledDate,
      endDate: calculatedEndDate,
      booking_start_time,
      booking_end_time: bookingEndTime,
      bookingHours: bookingHours || finalTotalDuration,
      bookingDays: bookingDays || 1,
      totalDuration: finalTotalDuration,
      totalPrice,
      isEmergency,
      acceptanceExpiresAt,
      // ✅ CORRECT INITIAL STATUS:
      status: "Pending_Contractor_Approval",
      paymentStatus: "Pending",
    });

    // Notify Contractor
    await Notification.create({
      user: contractorId,
      message: `New Job Request: ${serviceName} for Rs. ${totalPrice}. Please Accept or Reject.`,
      type: "info",
      relatedBooking: booking._id,
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Status (Accept/Reject/Complete)
// @route   PUT /api/bookings/:id
// @desc    Update Status (Accept/Reject/Complete)
// @route   PUT /api/bookings/:id
const updateStatus = async (req, res) => {
  try {
    const { status, completionImages } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // ✅ LOGIC 1: Contractor Accepts -> Wait for Payment
    // We allow this if the status is "Accepted"
    if (status === "Accepted") {
      booking.status = "Payment_Pending";
      booking.acceptanceExpiresAt = null; // Clear acceptance expiration timer
      booking.acceptanceExpired = false;

      // Set payment expiration time (2 hours from now)
      const now = new Date();
      booking.paymentExpiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

      await Notification.create({
        user: booking.user,
        message: `Contractor accepted your job! Please upload payment proof within 2 hours to start.`,
        type: "success",
        relatedBooking: booking._id,
      });
    }
    // ✅ LOGIC 2: Completion - Contractor marks job done with proof
    else if (status === "Completed") {
      if (!completionImages || completionImages.length < 2) {
        return res
          .status(400)
          .json({ message: "Please upload 2 proof images." });
      }

      console.log(
        `[JOB COMPLETION] Marking booking ${booking._id} as Completed by contractor ${booking.contractor}`,
      );

      booking.status = "Completed";
      booking.completionImages = completionImages;
      booking.completedAt = new Date(); // Track when contractor marked job done

      // Save booking BEFORE changing contractor availability
      await booking.save();
      console.log(`[JOB COMPLETION] Booking saved with status=Completed`);

      // Update contractor availability back to Available (no more active jobs)
      console.log(
        `[JOB COMPLETION] Calling updateContractorAvailability to set contractor back to Available`,
      );
      await updateContractorAvailability(booking.contractor);

      await Notification.create({
        user: booking.user,
        message: `Job Completed! Please review and release payment.`,
        type: "success",
        relatedBooking: booking._id,
      });
    }
    // ✅ LOGIC 3: Rejection/Cancellation - Free up contractor
    else {
      console.log(
        `[JOB REJECTION] Booking ${booking._id} status changed to ${status}`,
      );
      booking.status = status; // e.g., "Rejected", "Cancelled"
      booking.acceptanceExpiresAt = null; // Clear expiration timer
      booking.acceptanceExpired = false;

      // Save booking BEFORE changing contractor availability
      await booking.save();
      console.log(`[JOB REJECTION] Booking saved with status=${status}`);

      // If rejected/cancelled, free up the contractor availability
      console.log(
        `[JOB REJECTION] Freeing up contractor ${booking.contractor}`,
      );
      await updateContractorAvailability(booking.contractor);
      console.log(`[JOB REJECTION] Contractor availability updated`);

      return res.json(booking);
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ... (Keep existing methods: getMyBookings, getBookingDetails, uploadPayment, markJobSatisfied, getEarningsHistory, deleteBooking)
// Ensure you include them below in the module.exports

const getMyBookings = async (req, res) => {
  const limit = parseInt(req.query.limit) || 0;
  const query = Booking.find({
    $or: [{ user: req.user._id }, { contractor: req.user._id }],
  })
    .populate("user", "fullName email phone address location")
    .populate(
      "contractor",
      "fullName email phone address availability availabilityStatus skill experience rating totalReviews",
    )
    .populate({
      path: "dispute",
      select: "status adminDecision adminComment",
    })
    .sort({ createdAt: -1 });
  if (limit > 0) query.limit(limit);
  const bookings = await query.exec();
  res.json(bookings);
};

const getAllBookings = async (req, res) => {
  const limit = parseInt(req.query.limit) || 0;
  const query = Booking.find()
    .populate("user", "fullName email phone address location")
    .populate(
      "contractor",
      "fullName email phone address availability availabilityStatus skill experience rating totalReviews",
    )
    .populate({
      path: "dispute",
      select: "status adminDecision adminComment",
    })
    .sort({ createdAt: -1 });
  if (limit > 0) query.limit(limit);
  const bookings = await query.exec();
  res.json(bookings);
};

const getBookingDetails = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("user")
    .populate("contractor");
  res.json(booking);
};

const uploadPayment = async (req, res) => {
  try {
    const { screenshotUrl } = req.body;

    if (!screenshotUrl) {
      return res
        .status(400)
        .json({ message: "Payment screenshot is required" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.paymentScreenshot = screenshotUrl;
    booking.status = "Verification_Pending";
    booking.paymentExpiresAt = null; // Clear payment expiration timer
    booking.paymentExpired = false;
    await booking.save();

    // Notify all admins to review the payment
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user: admin._id,
        message: `Payment Verification: ${booking.serviceName} - Rs. ${booking.totalPrice}`,
        type: "verification",
        relatedBooking: booking._id,
      }));
      await Notification.insertMany(notifications);
    }

    res.json(booking);
  } catch (error) {
    console.error("Upload Payment Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const markJobSatisfied = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (booking.status !== "Completed")
    return res.status(400).json({ message: "Not completed yet" });
  const { contractorAmount } = calculateNormalPayment(booking.totalPrice);
  await Contractor.findByIdAndUpdate(booking.contractor, {
    $inc: { walletBalance: contractorAmount },
  });
  booking.status = "Completed_And_Confirmed";
  booking.paymentStatus = "Completed";
  booking.userSatisfied = true;
  booking.satisfiedAt = Date.now();
  await booking.save();
  await Notification.create({
    user: booking.contractor,
    message: `Payment Released! Rs. ${contractorAmount}`,
    type: "success",
  });
  await updateContractorAvailability(booking.contractor);
  res.json({
    message: "Payment Released",
    contractorAmount,
    contractorReceived: contractorAmount,
  });
};

const getEarningsHistory = async (req, res) => {
  const bookings = await Booking.find({
    contractor: req.user._id,
    paymentStatus: "Completed",
  }).populate("user", "fullName");
  const reviews = await Review.find({ contractor: req.user._id });
  const earnings = bookings.map((job) => {
    const { contractorAmount } = calculateNormalPayment(job.totalPrice);
    const review = reviews.find(
      (r) => r.booking.toString() === job._id.toString(),
    );
    return {
      _id: job._id,
      clientName: job.user.fullName,
      serviceName: job.serviceName,
      amountEarned: contractorAmount,
      rating: review ? review.rating : null,
    };
  });
  res.json({
    total: earnings.length,
    totalEarnings: earnings.reduce((a, b) => a + b.amountEarned, 0),
    earnings,
  });
};

const deleteBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  const contractorId = booking.contractor;
  await Booking.findByIdAndDelete(req.params.id);
  await updateContractorAvailability(contractorId);
  res.json({ message: "Deleted" });
};

// @desc    Migrate old Payment_Pending bookings to add paymentExpiresAt
// @route   POST /api/bookings/migrate/add-payment-timers
const migratePaymentTimers = async (req, res) => {
  try {
    const now = new Date();

    // Find all Payment_Pending bookings without paymentExpiresAt
    const bookingsToUpdate = await Booking.find({
      status: "Payment_Pending",
      paymentExpiresAt: { $exists: false }
    });

    console.log(`[MIGRATION] Found ${bookingsToUpdate.length} bookings to update`);

    // Update each booking to add paymentExpiresAt (2 hours from now)
    for (const booking of bookingsToUpdate) {
      booking.paymentExpiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      await booking.save();
    }

    res.json({
      message: `Successfully updated ${bookingsToUpdate.length} bookings with payment timers`,
      count: bookingsToUpdate.length
    });
  } catch (error) {
    console.error("Migration Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingDetails,
  uploadPayment,
  updateStatus,
  markJobSatisfied,
  getEarningsHistory,
  deleteBooking,
  migratePaymentTimers,
};
