const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
    getFinancialAnalytics,
    exportFinancialReport,
} = require("../controllers/analyticsController");

// Financial Analytics (Admin Only)
router.get("/financial", protect, adminOnly, getFinancialAnalytics);

// Export Report as CSV (Admin Only)
router.get("/export", protect, adminOnly, exportFinancialReport);

module.exports = router;
