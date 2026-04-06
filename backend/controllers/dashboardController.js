const Booking = require("../models/Booking");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");
const Contractor = require("../models/Contractor"); // ✅ Added Contractor Model
const Settings = require("../models/Settings"); // ✅ Added Settings Model
const mongoose = require("mongoose");

// @desc    Get Dashboard Statistics (For User & Contractor)
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const { role, _id } = req.user;
    // Safe ObjectId conversion to prevent aggregation crashes
    const userId = new mongoose.Types.ObjectId(_id);
    let stats = {};

    if (role === "contractor") {
      // --- CONTRACTOR STATS ---
      // 1. Total Earnings (Only Completed & Paid bookings)
      const earnings = await Booking.aggregate([
        {
          $match: {
            contractor: userId,
            status: "Completed",
            paymentStatus: "Completed",
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]);

      const totalBookings = await Booking.countDocuments({
        contractor: userId,
      });

      const activeBookings = await Booking.countDocuments({
        contractor: userId,
        status: {
          $in: ["Active", "Pending_Approval", "Pending_Contractor_Approval"],
        },
      });

      const completedBookings = await Booking.countDocuments({
        contractor: userId,
        status: "Completed",
      });

      stats = {
        totalEarnings: earnings.length > 0 ? earnings[0].total : 0,
        totalBookings,
        activeBookings,
        completedBookings,
      };
    } else if (role === "user") {
      // --- USER STATS ---
      const totalSpent = await Booking.aggregate([
        {
          $match: {
            user: userId,
            status: "Completed",
            paymentStatus: "Completed",
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]);

      const totalBookings = await Booking.countDocuments({ user: userId });

      const activeBookings = await Booking.countDocuments({
        user: userId,
        status: { $in: ["Active", "Pending_Approval"] },
      });

      stats = {
        totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
        totalBookings,
        activeBookings,
      };
    }

    res.json(stats);
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Server Error fetching stats" });
  }
};

// @desc    Get Admin Dashboard Stats & Data (Optimized)
// @route   GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalContractors = await Contractor.countDocuments({});
    const activeJobs = await Booking.countDocuments({ status: "Active" });

    const pendingPayments = await Booking.find({
      status: "Verification_Pending",
    })
      .populate("user", "fullName email")
      .populate("contractor", "fullName email")
      .select("-paymentScreenshot -completionImages")
      .sort({ updatedAt: -1 });

    const pendingWithdrawals = await Withdrawal.find({ status: "Pending" })
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });

    const activeDisputes = await Booking.find({ status: "Disputed" })
      .populate("user", "fullName")
      .populate("contractor", "fullName")
      .select("-paymentScreenshot -completionImages");

    res.json({
      stats: { totalUsers, totalContractors, activeJobs },
      pendingPayments,
      pendingWithdrawals,
      activeDisputes,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get lightweight admin dashboard counts
// @route   GET /api/dashboard/admin/counts
const getAdminDashboardCounts = async (req, res) => {
  try {
    const [payments, withdrawals, disputes, bookings, users, contractors] =
      await Promise.all([
        Booking.countDocuments({ status: "Verification_Pending" }),
        Withdrawal.countDocuments({ status: "Pending" }),
        Booking.countDocuments({ status: "Disputed" }),
        Booking.countDocuments({}),
        User.countDocuments({ role: "user" }),
        Contractor.countDocuments({}),
      ]);

    res.json({
      payments,
      withdrawals,
      disputes,
      bookings,
      users,
      contractors,
    });
  } catch (error) {
    console.error("Admin counts error:", error);
    res.status(500).json({ message: "Failed to fetch admin counts" });
  }
};

// @desc    Get User/Contractor Notifications
// @route   GET /api/dashboard/notifications
const getNotifications = async (req, res) => {
  try {
    const Notification = require("../models/Notification");

    // Check if logged-in user is a contractor or customer
    let query = {};
    if (req.user.role === "contractor") {
      query.contractor = req.user._id;
    } else {
      query.user = req.user._id;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Notification
// @route   POST /api/dashboard/notifications/create
const createNotification = async (req, res) => {
  try {
    const Notification = require("../models/Notification");
    const {
      userId,
      contractorId,
      message,
      type,
      relatedBooking,
      notifCategory,
    } = req.body;

    const notificationData = {
      message,
      type: type || "info",
      notifCategory: notifCategory || "general",
    };

    // Add user or contractor field based on what's provided
    if (userId) notificationData.user = userId;
    if (contractorId) notificationData.contractor = contractorId;
    if (relatedBooking) {
      notificationData.relatedBooking = relatedBooking;
      notificationData.relatedId = relatedBooking;
    }

    const notification = await Notification.create(notificationData);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Create Notification Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark Notification as Read
// @route   PUT /api/dashboard/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    const Notification = require("../models/Notification");
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Notification
const deleteNotification = async (req, res) => {
  try {
    const Notification = require("../models/Notification");
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin Settings
// @route   GET /api/dashboard/admin/settings
const getAdminSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json(settings);
  } catch (error) {
    console.error("Get Settings Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Admin Settings (IBAN, Bank Name, etc.)
// @route   PUT /api/dashboard/admin/settings
const updateAdminSettings = async (req, res) => {
  try {
    const {
      ibanNumber,
      bankName,
      accountHolderName,
      companyName,
      companyEmail,
      companyPhone,
    } = req.body;

    // Validate IBAN format (basic validation)
    if (ibanNumber && ibanNumber.length < 15) {
      return res.status(400).json({ message: "Invalid IBAN format" });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        ibanNumber,
        bankName,
        accountHolderName,
        companyName,
        companyEmail,
        companyPhone,
        lastUpdatedBy: req.user._id,
      });
    } else {
      if (ibanNumber !== undefined) settings.ibanNumber = ibanNumber;
      if (bankName !== undefined) settings.bankName = bankName;
      if (accountHolderName !== undefined)
        settings.accountHolderName = accountHolderName;
      if (companyName !== undefined) settings.companyName = companyName;
      if (companyEmail !== undefined) settings.companyEmail = companyEmail;
      if (companyPhone !== undefined) settings.companyPhone = companyPhone;
      settings.lastUpdatedBy = req.user._id;
      await settings.save();
    }

    res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats, // ✅ ADDED BACK (Fixes the crash)
  getAdminDashboard,
  getAdminDashboardCounts,
  getNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification,
  getAdminSettings,
  updateAdminSettings,
};
