const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getDashboardStats, // ✅ Imported correctly
  getAdminDashboard,
  getAdminDashboardCounts,
  getNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification,
  getAdminSettings,
  updateAdminSettings,
} = require("../controllers/dashboardController");

// General Dashboard Stats (User & Contractor)
router.get("/stats", protect, getDashboardStats); // ✅ ADDED THIS ROUTE

// Admin Dashboard (Protected + Admin Only)
router.get("/admin", protect, adminOnly, getAdminDashboard);
router.get("/admin/counts", protect, adminOnly, getAdminDashboardCounts);

// Notifications (Protected - Any User)
router.get("/notifications", protect, getNotifications);
router.post("/notifications/create", protect, createNotification);
router.put("/notifications/:id/read", protect, markNotificationRead);
router.delete("/notifications/:id", protect, deleteNotification);

// Settings Routes
// Public endpoint: Get settings (no auth needed for payment page)
router.get("/settings", getAdminSettings);

// Admin Settings (Protected + Admin Only)
router.get("/admin/settings", protect, adminOnly, getAdminSettings);
router.put("/admin/settings", protect, adminOnly, updateAdminSettings);

module.exports = router;
