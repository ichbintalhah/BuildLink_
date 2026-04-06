const Advisory = require("../models/Advisory"); // We'll create this model if it doesn't exist
const Notification = require("../models/Notification");

// @desc    Book an Advisory Visit
// @route   POST /api/advisory
// @access  Public (doesn't need authentication)
const bookAdvisoryVisit = async (req, res) => {
  try {
    const { fullName, phone, address, visitDate, problemDescription } =
      req.body;

    // Validate required fields
    if (!fullName || !phone || !address || !visitDate || !problemDescription) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields" });
    }

    // Create Advisory Visit record
    const advisory = await Advisory.create({
      fullName,
      phone,
      address,
      visitDate,
      problemDescription,
      status: "Pending", // Pending, Scheduled, Completed, Cancelled
      createdAt: new Date(),
    });

    // Send success response
    res.status(201).json({
      message: "Advisory visit booked successfully!",
      advisory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Advisory Visits (Admin only)
// @route   GET /api/advisory
// @access  Private (Admin)
const getAllAdvisoryVisits = async (req, res) => {
  try {
    const advisories = await Advisory.find().sort({ createdAt: -1 });
    res.json(advisories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Advisory Visit Status (Admin)
// @route   PUT /api/advisory/:id
// @access  Private (Admin)
const updateAdvisoryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const advisory = await Advisory.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!advisory) {
      return res.status(404).json({ message: "Advisory visit not found" });
    }

    res.json({
      message: "Advisory visit updated successfully",
      advisory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  bookAdvisoryVisit,
  getAllAdvisoryVisits,
  updateAdvisoryStatus,
};
