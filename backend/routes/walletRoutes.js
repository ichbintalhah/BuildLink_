const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
    requestWithdrawal,
    getWithdrawalHistory,
    getPendingWithdrawals,
    processWithdrawal,
} = require("../controllers/walletController");

const router = express.Router();

// Contractor Routes
router.post("/withdraw", protect, requestWithdrawal);
router.get("/history", protect, getWithdrawalHistory);

// Admin Routes
router.get("/admin/requests", protect, adminOnly, getPendingWithdrawals);
router.put("/admin/:id", protect, adminOnly, processWithdrawal);

module.exports = router;