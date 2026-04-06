const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
    verifyPayment,
    getAdminPaymentHistory,
} = require("../controllers/paymentController");

// Admin payment verification history
router.get("/admin/history", protect, adminOnly, getAdminPaymentHistory);

// Admin verifies payment screenshot (Approve/Reject)
router.put("/:bookingId/verify", protect, adminOnly, verifyPayment);

module.exports = router;