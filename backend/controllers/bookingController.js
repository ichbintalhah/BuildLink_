const Booking = require("../models/Booking");
const User = require("../models/User");
const Contractor = require("../models/Contractor");
const Notification = require("../models/Notification");
const Review = require("../models/Review");
const {
  calculateNormalPayment,
  calculateDisputeSplit,
} = require("../utils/paymentService");
const Dispute = require("../models/Dispute");
const Withdrawal = require("../models/Withdrawal");
const { updateContractorAvailability } = require("../utils/bookingScheduler");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".avif",
];

const isHttpUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value.trim());

const decodeBase64Image = (value) => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  const dataUriMatch = trimmed.match(/^data:[^;]+;base64,(.+)$/i);

  try {
    if (dataUriMatch && dataUriMatch[1]) {
      return Buffer.from(dataUriMatch[1], "base64");
    }

    // Fallback for raw base64 payloads without a data URI prefix
    return Buffer.from(trimmed, "base64");
  } catch {
    return null;
  }
};

const uploadBookingImageIfNeeded = async (image, folder, fileName) => {
  if (!image || typeof image !== "string") {
    throw new Error("Invalid image payload");
  }

  if (isHttpUrl(image)) {
    return image;
  }

  const imageBuffer = decodeBase64Image(image);
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Image must be a valid URL or base64 data URI");
  }

  return uploadToCloudinary(imageBuffer, folder, fileName);
};

const isValidImageUrl = (value) => {
  if (!isHttpUrl(value)) return false;

  try {
    const parsedUrl = new URL(value);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;

    const pathname = (parsedUrl.pathname || "").toLowerCase();
    const isCloudinary = /(^|\.)res\.cloudinary\.com$/i.test(
      parsedUrl.hostname,
    );

    if (isCloudinary) return true;

    return ALLOWED_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
};

const sanitizeImageUrlArray = (images, maxCount = 5) => {
  if (!Array.isArray(images)) return [];

  const unique = new Set();
  const cleaned = [];

  for (const image of images) {
    if (typeof image !== "string") continue;
    const trimmed = image.trim();
    if (!trimmed || unique.has(trimmed)) continue;
    if (!isValidImageUrl(trimmed)) continue;

    unique.add(trimmed);
    cleaned.push(trimmed);

    if (cleaned.length >= maxCount) break;
  }

  return cleaned;
};

const getMilestoneWorkflowState = (milestone) => {
  if (!milestone) return "pending_payment";
  if (milestone.workflowState) return milestone.workflowState;

  if (milestone.completedAt) return "completed";
  if (milestone.status === "paid") return "approved";
  return "pending_payment";
};

const isMilestoneFundedForWork = (milestone) => {
  const state = getMilestoneWorkflowState(milestone);
  return ["funded", "in_progress", "approved", "auto_released"].includes(state);
};

const isBookingLockedByNonPayment = (booking) =>
  booking?.status === "Expired_Non_Payment" || booking?.paymentExpired === true;

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
      // Heavy duty construction fields
      bookingType,
      paymentSchedule,
      isCustomJob,
      conversationId,
      job, // Heavy duty job title
      startDateTime,
      endDateTime,
      budget,
      description,
      clientPhone,
      clientAddress,
      clientArea,
    } = req.body;

    // Handle heavy duty construction bookings
    if (bookingType === "heavy-duty-construction") {
      if (!job || !startDateTime || !endDateTime || !budget) {
        return res.status(400).json({
          message:
            "Heavy duty booking requires job, startDateTime, endDateTime, and budget",
        });
      }

      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Calculate total project duration in days (inclusive calendar days)
      // Reset times to midnight for accurate day counting
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(endDate);
      endDay.setHours(0, 0, 0, 0);
      const totalProjectDays =
        Math.round((endDay - startDay) / (1000 * 60 * 60 * 24)) + 1;
      const totalProjectHours = totalProjectDays * 24;

      // Calculate acceptance expiration
      const now = new Date();
      const acceptanceExpiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

      // Initialize milestones in Pending Payment state.
      // Work timers are assigned only after escrow funding is verified.
      let processedSchedule = [];
      if (paymentSchedule && paymentSchedule.length > 0) {
        processedSchedule = paymentSchedule.map((milestone, index) => {
          return {
            ...milestone,
            milestoneDeadline: null,
            milestoneStartDate: null,
            status: "pending",
            workflowState: "pending_payment",
          };
        });
      }

      const booking = await Booking.create({
        user: req.user._id,
        contractor: contractorId,
        serviceName: job,
        scheduledDate: startDate,
        endDate: endDate,
        totalPrice: budget,
        totalDuration: totalProjectHours, // Set total duration in hours
        bookingDays: totalProjectDays, // Set total days
        bookingType: "heavy-duty-construction",
        paymentSchedule: processedSchedule,
        isCustomJob: isCustomJob || false,
        conversationId: conversationId,
        clientPhone: clientPhone,
        clientAddress: clientAddress,
        clientArea: clientArea,
        description: description,
        acceptanceExpiresAt,
        status: "Pending_Contractor_Approval",
        paymentStatus: "Pending",
        currentMilestone: 0, // Start with first milestone
      });

      // Notify Contractor
      await Notification.create({
        contractor: contractorId,
        message: `New Heavy Duty Construction Request: ${job} for Rs. ${budget}. Please Accept or Reject.`,
        type: "info",
        relatedBooking: booking._id,
        notifCategory: "booking_request",
      });

      return res.status(201).json(booking);
    }

    // Regular booking logic continues below
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
      now.getTime() + (isEmergency ? 30 : 60) * 60 * 1000,
    ); // 30 minutes for emergency, 60 minutes for normal

    // Handle problem images upload for custom jobs
    let problemImageUrls = [];

    if (isCustomJob) {
      if (!req.files || req.files.length < 2) {
        return res.status(400).json({
          message: "Custom bookings require at least 2 problem images",
        });
      }

      if (req.files.length > 5) {
        return res.status(400).json({
          message: "Custom bookings allow a maximum of 5 problem images",
        });
      }
    }

    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map(async (file) => {
          const fileName = `problem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          return await uploadToCloudinary(
            file.buffer,
            "booking_problems",
            fileName,
          );
        });
        problemImageUrls = await Promise.all(uploadPromises);
        problemImageUrls = sanitizeImageUrlArray(problemImageUrls, 5);

        if (isCustomJob && problemImageUrls.length < 2) {
          return res.status(400).json({
            message:
              "At least 2 valid problem images are required for custom bookings",
          });
        }
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return res
          .status(500)
          .json({ message: "Failed to upload problem images" });
      }
    }

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
      problemImages: problemImageUrls,
      // ✅ CORRECT INITIAL STATUS:
      status: "Pending_Contractor_Approval",
      paymentStatus: "Pending",
    });

    // Notify Contractor
    await Notification.create({
      contractor: contractorId,
      message: `New Job Request: ${serviceName} for Rs. ${totalPrice}. Please Accept or Reject.`,
      type: "info",
      relatedBooking: booking._id,
      notifCategory: "booking_request",
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
    if (isBookingLockedByNonPayment(booking)) {
      return res.status(409).json({
        message:
          "This project is expired due to non-payment and is locked. No further actions are allowed.",
      });
    }

    // ✅ LOGIC 1: Contractor Accepts -> Wait for Payment
    // We allow this if the status is "Accepted"
    if (status === "Accepted") {
      booking.status = "Payment_Pending";
      booking.acceptanceExpiresAt = null; // Clear acceptance expiration timer
      booking.acceptanceExpired = false;

      // Set payment expiration time (2 hours from now)
      const now = new Date();
      booking.paymentExpiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

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

      await Notification.create({
        user: booking.user,
        message: `Contractor accepted your job! Please upload payment proof within 2 hours to start.`,
        type: "success",
        relatedBooking: booking._id,
        notifCategory: "booking_accepted",
      });
    }
    // ✅ LOGIC 2: Completion - Contractor marks job done with proof
    else if (status === "Completed") {
      if (!Array.isArray(completionImages) || completionImages.length < 2) {
        return res
          .status(400)
          .json({ message: "Please upload 2 proof images." });
      }

      let uploadedCompletionImages = completionImages;
      try {
        uploadedCompletionImages = await Promise.all(
          completionImages.map((image, index) =>
            uploadBookingImageIfNeeded(
              image,
              "booking_completions",
              `booking_${booking._id}_completion_${index + 1}_${Date.now()}`,
            ),
          ),
        );
      } catch (uploadError) {
        console.error("Completion image upload error:", uploadError.message);
        return res.status(500).json({
          message: "Failed to upload completion images",
        });
      }

      // Check if it's a heavy duty construction with payment milestones
      if (
        booking.bookingType === "heavy-duty-construction" &&
        booking.paymentSchedule &&
        booking.paymentSchedule.length > 0
      ) {
        const currentMilestoneIndex = booking.currentMilestone || 0;
        const currentMilestone = booking.paymentSchedule[currentMilestoneIndex];

        if (!currentMilestone) {
          return res
            .status(400)
            .json({ message: "All milestones already completed!" });
        }

        if (!isMilestoneFundedForWork(currentMilestone)) {
          return res.status(409).json({
            message:
              "Milestone work cannot start or complete before escrow funding is confirmed.",
          });
        }

        // Mark this milestone as complete (awaiting user satisfaction)
        // Replace entire array to guarantee Mongoose persists the changes
        const now = new Date();
        const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const updatedScheduleForCompletion = booking.paymentSchedule.map(
          (m, idx) => {
            const obj = m.toObject ? m.toObject() : { ...m };
            if (idx === currentMilestoneIndex) {
              obj.completionImages = uploadedCompletionImages;
              obj.completedAt = now;
              obj.satisfactionDeadline = threeHoursLater; // User has 3 hours to approve/dispute
              obj.workflowState = "completed";
              // Keep legacy status as "paid" for UI compatibility.
            }
            return obj;
          },
        );
        booking.paymentSchedule = updatedScheduleForCompletion;
        booking.markModified("paymentSchedule");

        // Check if this is the last milestone
        const isLastMilestone =
          currentMilestoneIndex === booking.paymentSchedule.length - 1;

        if (isLastMilestone) {
          // DON'T mark booking as Completed yet - user needs to approve first
          booking.status = "Active"; // Keep active until user approves
          booking.completionImages = uploadedCompletionImages;
          // DON'T set completedAt yet - only after user satisfaction

          await Notification.create({
            user: booking.user,
            message: `Final Milestone Completed! The contractor has finished all work for "${booking.serviceName}". Please review and confirm satisfaction.`,
            type: "success",
            relatedBooking: booking._id,
            notifCategory: "milestone_completion",
          });

          await Notification.create({
            contractor: booking.contractor?._id || booking.contractor,
            message: `Final milestone submitted! Waiting for client approval to release Rs. ${currentMilestone.amount}.`,
            type: "info",
            relatedBooking: booking._id,
            notifCategory: "milestone_completion",
          });
        } else {
          // Not the last milestone - job continues
          booking.status = "Active"; // Keep job active for next milestone

          await Notification.create({
            user: booking.user,
            message: `Milestone ${currentMilestoneIndex + 1} Completed! Review the work and click "I am satisfied" to release payment Rs. ${currentMilestone.amount} and start the next milestone.`,
            type: "info",
            relatedBooking: booking._id,
            notifCategory: "milestone_completion",
          });

          await Notification.create({
            contractor: booking.contractor?._id || booking.contractor,
            message: `Milestone ${currentMilestoneIndex + 1} submitted! Waiting for client approval to release Rs. ${currentMilestone.amount} and start next milestone timer.`,
            type: "info",
            relatedBooking: booking._id,
            notifCategory: "milestone_completion",
          });
        }

        await booking.save();
        return res.json({
          message: isLastMilestone
            ? "Final milestone submitted!"
            : "Milestone submitted for review!",
          booking,
        });
      }

      // Regular booking completion logic
      console.log(
        `[JOB COMPLETION] Marking booking ${booking._id} as Completed by contractor ${booking.contractor}`,
      );

      booking.status = "Completed";
      booking.completionImages = uploadedCompletionImages;
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
        notifCategory: "job_completion",
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

      // ✅ Notify user about rejection
      if (status === "Rejected") {
        await Notification.create({
          user: booking.user,
          message: `Your booking request for ${booking.serviceName} was rejected by the contractor. Please find another contractor for your job.`,
          type: "error",
          relatedBooking: booking._id,
          notifCategory: "booking_rejected",
        });
      }

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
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 200)
    : 50;
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
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const bookings = await query.exec();

  const bookingsWithSanitizedImages = bookings.map((booking) => ({
    ...booking,
    problemImages: sanitizeImageUrlArray(booking.problemImages, 5),
    completionImages: sanitizeImageUrlArray(booking.completionImages, 10),
  }));

  // Attach per-booking review details for contractor dashboard cards.
  if (req.user.role === "contractor" && bookingsWithSanitizedImages.length > 0) {
    const bookingIds = bookingsWithSanitizedImages.map((booking) => booking._id);
    const reviews = await Review.find({
      booking: { $in: bookingIds },
      contractor: req.user._id,
    }).select("booking rating comment");

    const reviewByBookingId = new Map(
      reviews.map((review) => [
        review.booking?.toString(),
        {
          rating: review.rating ?? null,
          reviewText: review.comment || "",
        },
      ]),
    );

    const bookingsWithReviews = bookingsWithSanitizedImages.map((booking) => {
      const review = reviewByBookingId.get(String(booking._id));

      return {
        ...booking,
        rating: review ? review.rating : null,
        reviewText: review ? review.reviewText : null,
      };
    });

    return res.json(bookingsWithReviews);
  }

  res.json(bookingsWithSanitizedImages);
};

const getAllBookings = async (req, res) => {
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 300)
    : 50;
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
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
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
    if (isBookingLockedByNonPayment(booking)) {
      return res.status(409).json({
        message:
          "This project is expired due to non-payment and is locked. No further actions are allowed.",
      });
    }
    if (!["Payment_Pending", "Rejected_Payment"].includes(booking.status)) {
      return res.status(409).json({
        message: "Payment upload is only allowed while payment is pending.",
      });
    }

    const isHeavyDuty =
      booking.bookingType === "heavy-duty-construction" &&
      booking.paymentSchedule &&
      booking.paymentSchedule.length > 0;
    const currentMilestoneIndex = booking.currentMilestone || 0;
    const currentMilestone = isHeavyDuty
      ? booking.paymentSchedule[currentMilestoneIndex]
      : null;

    if (isHeavyDuty) {
      if (!currentMilestone) {
        return res.status(400).json({ message: "No active milestone found." });
      }
      const workflowState = getMilestoneWorkflowState(currentMilestone);
      if (workflowState !== "pending_payment") {
        return res.status(409).json({
          message:
            "Payment upload is only allowed while the milestone is pending payment.",
        });
      }
    }

    let uploadedScreenshotUrl = screenshotUrl;
    try {
      const paymentLabel = isHeavyDuty
        ? `m${currentMilestoneIndex + 1}`
        : "full";
      uploadedScreenshotUrl = await uploadBookingImageIfNeeded(
        screenshotUrl,
        "booking_payments",
        `booking_${booking._id}_payment_${paymentLabel}_${Date.now()}`,
      );
    } catch (uploadError) {
      console.error("Payment screenshot upload error:", uploadError.message);
      return res.status(500).json({
        message: "Failed to upload payment screenshot",
      });
    }

    // Store payment screenshot appropriately
    if (isHeavyDuty && currentMilestone) {
      // For heavy duty construction, store screenshot in the specific milestone
      const updatedSchedule = booking.paymentSchedule.map((m, idx) => {
        const obj = m.toObject ? m.toObject() : { ...m };
        if (idx === currentMilestoneIndex) {
          obj.paymentScreenshot = uploadedScreenshotUrl;
          obj.workflowState = "payment_submitted";
        }
        return obj;
      });
      booking.paymentSchedule = updatedSchedule;
      booking.markModified("paymentSchedule");
    } else {
      // For regular bookings, store at booking level
      booking.paymentScreenshot = uploadedScreenshotUrl;
    }

    booking.status = "Verification_Pending";
    booking.paymentVerificationStatus = "Pending";
    booking.paymentVerifiedAt = null;
    booking.paymentVerifiedBy = null;
    booking.paymentRejectionReason = "";
    booking.paymentExpiresAt = null; // Clear payment expiration timer
    booking.paymentExpired = false;
    await booking.save();

    const paymentAmount =
      isHeavyDuty && currentMilestone?.amount
        ? currentMilestone.amount
        : booking.totalPrice;
    const paymentLabel = isHeavyDuty
      ? `Milestone ${currentMilestoneIndex + 1}/${booking.paymentSchedule.length}`
      : "Full Payment";

    // Notify all admins to review the payment
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user: admin._id,
        message: `Payment Verification: ${booking.serviceName} - ${paymentLabel} - Rs. ${paymentAmount}`,
        type: "verification",
        relatedBooking: booking._id,
        notifCategory: "payment_verification",
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
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "contractor",
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (isBookingLockedByNonPayment(booking)) {
      return res.status(409).json({
        message:
          "This project is expired due to non-payment and is locked. No further actions are allowed.",
      });
    }

    // Check if it's a heavy duty construction with milestones
    if (
      booking.bookingType === "heavy-duty-construction" &&
      booking.paymentSchedule &&
      booking.paymentSchedule.length > 0
    ) {
      const currentMilestoneIndex = booking.currentMilestone || 0;
      const currentMilestone = booking.paymentSchedule[currentMilestoneIndex];

      if (!currentMilestone || !currentMilestone.completedAt) {
        return res
          .status(400)
          .json({ message: "No completed milestone to approve!" });
      }

      const workflowState = getMilestoneWorkflowState(currentMilestone);
      if (workflowState !== "completed") {
        return res.status(409).json({
          message:
            "This milestone is not ready for approval. It must be completed first.",
        });
      }

      // Release payment for this milestone (Apply 5% admin commission)
      const milestoneAmount = currentMilestone.amount;
      const { contractorAmount, adminAmount } =
        calculateNormalPayment(milestoneAmount);
      await Contractor.findByIdAndUpdate(booking.contractor._id, {
        $inc: { walletBalance: contractorAmount },
      });

      // Replace entire array to guarantee Mongoose persists the "paid" status
      const releaseTime = new Date();
      const updatedScheduleForPaid = booking.paymentSchedule.map((m, idx) => {
        const obj = m.toObject ? m.toObject() : { ...m };
        if (idx === currentMilestoneIndex) {
          obj.status = "paid";
          obj.satisfactionDeadline = null; // Clear satisfaction deadline when user approves
          obj.workflowState = "approved";
          obj.releasedAt = releaseTime;
        }
        return obj;
      });
      booking.paymentSchedule = updatedScheduleForPaid;
      booking.markModified("paymentSchedule");

      // Check if this is the last milestone
      const isLastMilestone =
        currentMilestoneIndex === booking.paymentSchedule.length - 1;

      if (isLastMilestone) {
        // All milestones complete - finalize job
        booking.status = "Completed_And_Confirmed";
        booking.paymentStatus = "Completed";
        booking.userSatisfied = true;
        booking.satisfiedAt = Date.now();
        booking.completedAt = new Date(); // NOW set completedAt after user approval

        await Notification.create({
          contractor: booking.contractor?._id || booking.contractor,
          message: `🎉 Final Payment Released! Rs. ${contractorAmount} (after 5% admin fee) for "${booking.serviceName}". All milestones completed!`,
          type: "success",
          relatedBooking: booking._id,
          notifCategory: "milestone_payment",
        });

        await Notification.create({
          user: booking.user,
          message: `All milestones complete! Thank you for using our service for "${booking.serviceName}".`,
          type: "success",
          relatedBooking: booking._id,
          notifCategory: "milestone_payment",
        });

        // Update contractor availability (job completely done)
        await updateContractorAvailability(booking.contractor._id);

        await booking.save();
        return res.json({
          message: "Final payment released! Job complete.",
          milestoneAmount,
          contractorReceived: contractorAmount,
          adminCommission: adminAmount,
          allMilestonesComplete: true,
        });
      } else {
        // Move to next milestone
        booking.currentMilestone = currentMilestoneIndex + 1;
        const nextMilestone =
          booking.paymentSchedule[currentMilestoneIndex + 1];

        const now = new Date();

        // Replace entire array to guarantee Mongoose persists the changes
        const updatedSchedule = booking.paymentSchedule.map((m, idx) => {
          const obj = m.toObject ? m.toObject() : { ...m };
          if (idx === currentMilestoneIndex + 1) {
            obj.workflowState = "pending_payment";
            obj.milestoneStartDate = null;
            obj.milestoneDeadline = null;
            obj.completedAt = null;
            obj.completionImages = [];
            obj.satisfactionDeadline = null;
            obj.paymentScreenshot = null;
            obj.paymentVerifiedAt = null;
            obj.releasedAt = null;
            obj.autoReleasedAt = null;
            obj.status = "pending";
          }
          return obj;
        });
        booking.paymentSchedule = updatedSchedule;
        booking.markModified("paymentSchedule");

        await Notification.create({
          contractor: booking.contractor?._id || booking.contractor,
          message: `💰 Payment Released! Rs. ${contractorAmount} received (after 5% admin fee). Next milestone timer will start once client uploads payment proof for milestone ${currentMilestoneIndex + 2} (Rs. ${nextMilestone.amount}).`,
          type: "success",
          relatedBooking: booking._id,
          notifCategory: "milestone_payment",
        });

        await Notification.create({
          user: booking.user,
          message: `Milestone ${currentMilestoneIndex + 1} approved. Upload payment proof for milestone ${currentMilestoneIndex + 2} (Rs. ${nextMilestone.amount}) within 2 hours or the project will expire due to non-payment.`,
          type: "info",
          relatedBooking: booking._id,
          notifCategory: "milestone_payment",
        });

        // Require payment for next milestone
        booking.status = "Payment_Pending";
        booking.paymentExpired = false;
        booking.paymentExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await booking.save();

        return res.json({
          message: `Milestone ${currentMilestoneIndex + 1} payment released. Next milestone payment required.`,
          milestoneAmount,
          contractorReceived: contractorAmount,
          adminCommission: adminAmount,
          nextMilestone: {
            number: currentMilestoneIndex + 2,
            daysRequired: nextMilestone.daysCompleted,
            amount: nextMilestone.amount,
            paymentDeadline: booking.paymentExpiresAt,
          },
        });
      }
    }

    // Regular booking satisfaction logic
    if (booking.status !== "Completed") {
      return res.status(400).json({ message: "Not completed yet" });
    }

    const { contractorAmount } = calculateNormalPayment(booking.totalPrice);
    await Contractor.findByIdAndUpdate(booking.contractor._id, {
      $inc: { walletBalance: contractorAmount },
    });

    booking.status = "Completed_And_Confirmed";
    booking.paymentStatus = "Completed";
    booking.userSatisfied = true;
    booking.satisfiedAt = Date.now();
    await booking.save();

    await Notification.create({
      contractor: booking.contractor?._id || booking.contractor,
      message: `Payment Released! Rs. ${contractorAmount}`,
      type: "success",
      relatedBooking: booking._id,
      notifCategory: "payment_released",
    });

    await updateContractorAvailability(booking.contractor._id);

    res.json({
      message: "Payment Released",
      contractorAmount,
      contractorReceived: contractorAmount,
    });
  } catch (error) {
    console.error("Mark Satisfied Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getEarningsHistory = async (req, res) => {
  try {
    const isContractor = req.user.role === "contractor";

    if (isContractor) {
      // ===== CONTRACTOR EARNINGS =====
      const [
        regularBookings,
        heavyDutyBookings,
        disputes,
        reviews,
        withdrawals,
        contractor,
      ] = await Promise.all([
        Booking.find({
          contractor: req.user._id,
          paymentStatus: { $in: ["Completed", "Refunded"] },
          bookingType: { $ne: "heavy-duty-construction" },
        }).populate("user", "fullName"),
        Booking.find({
          contractor: req.user._id,
          bookingType: "heavy-duty-construction",
          "paymentSchedule.workflowState": {
            $in: ["approved", "auto_released"],
          },
        })
          .populate("user", "fullName")
          .select(
            "serviceName paymentSchedule user satisfiedAt autoCompletedAt updatedAt createdAt",
          ),
        Dispute.find({
          contractor: req.user._id,
          status: "Resolved",
        }),
        Review.find({ contractor: req.user._id }),
        Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 }),
        Contractor.findById(req.user._id).select("walletBalance"),
      ]);

      const disputeMap = {};
      disputes.forEach((d) => {
        if (d.booking) disputeMap[d.booking.toString()] = d;
      });

      const regularEarnings = regularBookings.map((job) => {
        const dispute = disputeMap[job._id.toString()];
        let amountEarned;
        let earningType = "normal";
        let disputeDecision = null;

        if (dispute && dispute.adminDecision) {
          disputeDecision = dispute.adminDecision;
          const splits = calculateDisputeSplit(
            job.totalPrice,
            dispute.adminDecision,
          );
          amountEarned = splits.contractorAmount;
          earningType = dispute.adminDecision.toLowerCase();
        } else {
          const { contractorAmount } = calculateNormalPayment(job.totalPrice);
          amountEarned = contractorAmount;
        }

        const review = reviews.find(
          (r) => r.booking.toString() === job._id.toString(),
        );

        return {
          _id: job._id,
          type: "earning",
          clientName: job.user?.fullName || "Unknown",
          serviceName: job.serviceName,
          jobTitle: job.serviceName,
          totalPrice: job.totalPrice,
          amountEarned,
          earningType,
          disputeDecision,
          completionDate:
            job.satisfiedAt ||
            job.autoCompletedAt ||
            job.completedAt ||
            job.updatedAt,
          rating: review ? review.rating : null,
          reviewText: review ? review.comment : null,
        };
      });

      const heavyDutyMilestoneEarnings = [];
      heavyDutyBookings.forEach((job) => {
        const schedule = Array.isArray(job.paymentSchedule)
          ? job.paymentSchedule
          : [];

        schedule.forEach((milestone, idx) => {
          if (
            !["approved", "auto_released"].includes(milestone?.workflowState)
          ) {
            return;
          }

          const milestoneAmount = Number(milestone.amount || 0);
          if (milestoneAmount <= 0) return;

          const { contractorAmount } = calculateNormalPayment(milestoneAmount);
          const isAutoReleased = milestone.workflowState === "auto_released";

          heavyDutyMilestoneEarnings.push({
            _id: `${job._id}-milestone-${idx + 1}`,
            type: "earning",
            clientName: job.user?.fullName || "Unknown",
            serviceName: job.serviceName,
            jobTitle: `${job.serviceName} (Milestone ${idx + 1}${isAutoReleased ? " Auto-Released" : ""})`,
            totalPrice: milestoneAmount,
            amountEarned: contractorAmount,
            earningType: isAutoReleased ? "auto_release" : "milestone",
            disputeDecision: null,
            completionDate:
              milestone.releasedAt ||
              milestone.autoReleasedAt ||
              milestone.completedAt ||
              job.satisfiedAt ||
              job.autoCompletedAt ||
              job.updatedAt ||
              job.createdAt,
            rating: null,
            reviewText: null,
          });
        });
      });

      const earnings = [...regularEarnings, ...heavyDutyMilestoneEarnings];

      const withdrawalRecords = withdrawals.map((w) => ({
        _id: w._id,
        type: "withdrawal",
        amount: w.amount,
        method: w.method,
        accountDetails: w.accountDetails,
        status: w.status,
        transactionScreenshot: w.transactionScreenshot,
        date: w.processedAt || w.createdAt,
        createdAt: w.createdAt,
      }));

      const totalEarnings = earnings.reduce((a, b) => a + b.amountEarned, 0);
      const totalWithdrawn = withdrawals
        .filter((w) => w.status === "Completed")
        .reduce((a, b) => a + b.amount, 0);
      const pendingWithdrawals = withdrawals
        .filter((w) => w.status === "Pending")
        .reduce((a, b) => a + b.amount, 0);

      res.json({
        total: earnings.length,
        totalEarnings,
        totalWithdrawn,
        pendingWithdrawals,
        walletBalance: contractor?.walletBalance || 0,
        earnings,
        withdrawals: withdrawalRecords,
      });
    } else {
      // ===== USER (HOMEOWNER) EARNINGS / REFUNDS =====
      const [bookings, disputes, withdrawals, userDoc] = await Promise.all([
        Booking.find({
          user: req.user._id,
          paymentStatus: { $in: ["Completed", "Refunded"] },
        }).populate("contractor", "fullName"),
        Dispute.find({
          user: req.user._id,
          status: "Resolved",
        }),
        Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 }),
        User.findById(req.user._id).select("walletBalance"),
      ]);

      const disputeMap = {};
      disputes.forEach((d) => {
        if (d.booking) disputeMap[d.booking.toString()] = d;
      });

      // For users, "earnings" are refunds they received from disputes
      const earnings = [];
      bookings.forEach((job) => {
        const dispute = disputeMap[job._id.toString()];
        if (dispute && dispute.adminDecision) {
          const splits = calculateDisputeSplit(
            job.totalPrice,
            dispute.adminDecision,
          );
          if (splits.userAmount > 0) {
            earnings.push({
              _id: job._id,
              type: "earning",
              clientName: job.contractor?.fullName || "Unknown",
              serviceName: job.serviceName,
              jobTitle: job.serviceName,
              totalPrice: job.totalPrice,
              amountEarned: splits.userAmount,
              earningType: dispute.adminDecision.toLowerCase(),
              disputeDecision: dispute.adminDecision,
              completionDate: dispute.updatedAt || job.updatedAt,
              rating: null,
              reviewText: null,
            });
          }
        }
      });

      const withdrawalRecords = withdrawals.map((w) => ({
        _id: w._id,
        type: "withdrawal",
        amount: w.amount,
        method: w.method,
        accountDetails: w.accountDetails,
        status: w.status,
        transactionScreenshot: w.transactionScreenshot,
        date: w.processedAt || w.createdAt,
        createdAt: w.createdAt,
      }));

      const totalEarnings = earnings.reduce((a, b) => a + b.amountEarned, 0);
      const totalWithdrawn = withdrawals
        .filter((w) => w.status === "Completed")
        .reduce((a, b) => a + b.amount, 0);
      const pendingWithdrawals = withdrawals
        .filter((w) => w.status === "Pending")
        .reduce((a, b) => a + b.amount, 0);

      res.json({
        total: earnings.length,
        totalEarnings,
        totalWithdrawn,
        pendingWithdrawals,
        walletBalance: userDoc?.walletBalance || 0,
        earnings,
        withdrawals: withdrawalRecords,
      });
    }
  } catch (error) {
    console.error("[EarningsHistory] Error:", error);
    res.status(500).json({ message: error.message });
  }
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
      paymentExpiresAt: { $exists: false },
    });

    console.log(
      `[MIGRATION] Found ${bookingsToUpdate.length} bookings to update`,
    );

    // Update each booking to add paymentExpiresAt (2 hours from now)
    for (const booking of bookingsToUpdate) {
      booking.paymentExpiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      await booking.save();
    }

    res.json({
      message: `Successfully updated ${bookingsToUpdate.length} bookings with payment timers`,
      count: bookingsToUpdate.length,
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
