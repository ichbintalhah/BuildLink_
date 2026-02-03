const Booking = require("../models/Booking");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");
const Contractor = require("../models/Contractor"); // ✅ Added Contractor Model
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
                { $match: { contractor: userId, status: "Completed", paymentStatus: "Completed" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]);

            const totalBookings = await Booking.countDocuments({ contractor: userId });

            const activeBookings = await Booking.countDocuments({
                contractor: userId,
                status: { $in: ["Active", "Pending_Approval", "Pending_Contractor_Approval"] }
            });

            const completedBookings = await Booking.countDocuments({
                contractor: userId,
                status: "Completed"
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
                { $match: { user: userId, status: "Completed", paymentStatus: "Completed" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]);

            const totalBookings = await Booking.countDocuments({ user: userId });

            const activeBookings = await Booking.countDocuments({
                user: userId,
                status: { $in: ["Active", "Pending_Approval"] }
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

        const pendingPayments = await Booking.find({ status: "Verification_Pending" })
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

// @desc    Get User/Contractor Notifications
// @route   GET /api/dashboard/notifications
const getNotifications = async (req, res) => {
    try {
        const Notification = require("../models/Notification");
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(notifications);
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

module.exports = {
    getDashboardStats, // ✅ ADDED BACK (Fixes the crash)
    getAdminDashboard,
    getNotifications,
    deleteNotification,
};