const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getDashboardStats, // ✅ Imported correctly
  getAdminDashboard,
  getNotifications,
  deleteNotification,
} = require("../controllers/dashboardController");

// General Dashboard Stats (User & Contractor)
router.get("/stats", protect, getDashboardStats); // ✅ ADDED THIS ROUTE

// Admin Dashboard (Protected + Admin Only)
router.get("/admin", protect, adminOnly, getAdminDashboard);

// Notifications (Protected - Any User)
router.get("/notifications", protect, getNotifications);
router.delete("/notifications/:id", protect, deleteNotification);

module.exports = router;