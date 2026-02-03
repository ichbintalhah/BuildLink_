const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { verifyPayment } = require("../controllers/paymentController");

// Admin verifies payment screenshot (Approve/Reject)
router.put("/:bookingId/verify", protect, adminOnly, verifyPayment);

module.exports = router;