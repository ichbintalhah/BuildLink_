const express = require("express");
const router = express.Router();
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

// Booking Routes
router.post("/", protect, createBooking);
router.get("/", protect, getMyBookings);
router.get("/admin/all", protect, getAllBookings); // Admin-only: all bookings
router.get("/earnings/history", protect, getEarningsHistory); // Place specific routes BEFORE dynamic :id routes
router.post("/migrate/add-payment-timers", protect, migratePaymentTimers); // Migration endpoint
router.get("/:id", protect, getBookingDetails); // <--- New Route for fetching single booking with images
router.put("/:id/payment", protect, uploadPayment);
router.put("/:id", protect, updateStatus);
router.put("/:id/satisfied", protect, markJobSatisfied);
router.delete("/:id", protect, deleteBooking);

module.exports = router;