const Review = require("../models/Review");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { calculateContractorRating } = require("./userController");

// @desc    Add a Review
// @route   POST /api/reviews
// STEP 1 FIX: Comment is now optional (user can submit rating without text)
// ISSUE 1 FIX: Use dynamic rating calculation from Review collection
const addReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  try {
    // 1. Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 2. Security Check: Only the user who booked can review
    if (booking.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to review this job" });
    }

    // 3. Create Review
    // STEP 1 FIX: Comment defaults to empty string if not provided
    const review = await Review.create({
      booking: bookingId,
      user: req.user._id,
      contractor: booking.contractor,
      rating,
      comment: comment || "", // Optional - default to empty string
    });

    // 4. ISSUE 1 FIX: Recalculate contractor rating dynamically from Review collection
    // This ensures deleted reviews never show stale data
    // Store the calculated values in User schema for quick lookup
    const ratingData = await calculateContractorRating(booking.contractor);
    await User.findByIdAndUpdate(booking.contractor, {
      rating: ratingData.rating,
      totalReviews: ratingData.totalReviews,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Reviews for a Contractor
// @route   GET /api/reviews/:contractorId
const getContractorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ contractor: req.params.contractorId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addReview, getContractorReviews };
