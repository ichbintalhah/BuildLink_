const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/bookingController");
const { fixMilestoneDates } = require("../controllers/fixMilestoneController");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/avif",
]);

const upload = multer({
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit per file
  fileFilter: (req, file, cb) => {
    if (allowedImageMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

const handleProblemImagesUpload = (req, res, next) => {
  upload.array("problemImages", 5)(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_COUNT") {
        return res
          .status(400)
          .json({ message: "You can upload a maximum of 5 problem images" });
      }

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Each image must be 3MB or less",
        });
      }
    }

    return res.status(400).json({
      message: err.message || "Invalid problem image upload",
    });
  });
};

// Booking Routes
router.post("/", protect, handleProblemImagesUpload, createBooking);
router.get("/", protect, getMyBookings);
router.get("/admin/all", protect, getAllBookings); // Admin-only: all bookings
router.get("/earnings/history", protect, getEarningsHistory); // Place specific routes BEFORE dynamic :id routes
router.post("/migrate/add-payment-timers", protect, migratePaymentTimers); // Migration endpoint
router.put("/:id/fix-milestone-dates", protect, fixMilestoneDates); // Fix milestone dates for existing bookings
router.get("/:id", protect, getBookingDetails); // <--- New Route for fetching single booking with images
router.put("/:id/payment", protect, uploadPayment);
router.put("/:id", protect, updateStatus);
router.put("/:id/satisfied", protect, markJobSatisfied);
router.delete("/:id", protect, deleteBooking);

module.exports = router;
