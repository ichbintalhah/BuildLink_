const User = require("../models/User");
const Contractor = require("../models/Contractor");
const Notification = require("../models/Notification");
const Withdrawal = require("../models/Withdrawal");

// @desc    Request Withdrawal (Contractor)
// @route   POST /api/wallet/withdraw
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;
    const isContractor = req.user.role === "contractor";
    const account = isContractor
      ? await Contractor.findById(req.user._id)
      : await User.findById(req.user._id);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (amt > account.walletBalance) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      userModel: isContractor ? "Contractor" : "User",
      amount: amt,
      method,
      accountDetails,
      status: "Pending",
    });

    console.log(
      `[Withdrawal] New Request by ${account.fullName} (${isContractor ? "Contractor" : "User"}) for Rs. ${amt}`
    );

    // ✅ NOTIFY ALL ADMINS about new withdrawal request
    const admins = await User.find({ role: "admin" });
    const adminNotifications = admins.map((admin) => ({
      user: admin._id,
      message: `New Withdrawal Request: Rs. ${amt} from ${account.fullName}`,
      type: "alert",
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Withdrawal History
// @route   GET /api/wallet/history
const getWithdrawalHistory = async (req, res) => {
  try {
    const history = await Withdrawal.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Pending Withdrawals (Admin)
// @route   GET /api/wallet/admin/requests
const getPendingWithdrawals = async (req, res) => {
  try {
    const requests = await Withdrawal.find({ status: "Pending" }).populate({
      path: "user",
      select: "fullName email walletBalance contractorDetails paymentMethod phoneForMobileWallet ibanNumber",
      options: { lean: true },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process Withdrawal (Admin Uploads Proof)
// @route   PUT /api/wallet/admin/:id
const processWithdrawal = async (req, res) => {
  try {
    const { status, transactionScreenshot } = req.body;

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal)
      return res.status(404).json({ message: "Request not found" });

    if (status === "Completed") {
      if (!transactionScreenshot) {
        return res
          .status(400)
          .json({ message: "Proof screenshot is required" });
      }

      // Deduct from User Wallet
      const accountModel = withdrawal.userModel === "Contractor" ? Contractor : User;
      const account = await accountModel.findById(withdrawal.user);
      if (account.walletBalance < withdrawal.amount) {
        return res
          .status(400)
          .json({ message: "User balance is now insufficient" });
      }
      account.walletBalance -= withdrawal.amount;
      await account.save();

      withdrawal.status = "Completed";
      withdrawal.transactionScreenshot = transactionScreenshot;
      withdrawal.processedAt = Date.now();

      // ✅ NOTIFY admin about completion
      const admins = await User.find({ role: "admin" });
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        message: `Withdrawal Processed: Rs. ${withdrawal.amount} sent to ${account.fullName}`,
        type: "success",
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }

      // Notify Contractor
      await Notification.create({
        user: withdrawal.user,
        message: `Withdrawal Approved! Rs. ${withdrawal.amount} sent. View proof in earnings.`,
        type: "success",
      });
    } else if (status === "Rejected") {
      withdrawal.status = "Rejected";

      // ✅ NOTIFY admin about rejection
      const admins = await User.find({ role: "admin" });
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        message: `Withdrawal Rejected: Rs. ${withdrawal.amount} request`,
        type: "info",
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }

      await Notification.create({
        user: withdrawal.user,
        message: `Withdrawal Rejected. Contact support.`,
        type: "error",
      });
    }

    await withdrawal.save();
    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestWithdrawal,
  getWithdrawalHistory,
  getPendingWithdrawals,
  processWithdrawal,
};
