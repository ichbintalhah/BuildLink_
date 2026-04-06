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
    const AccountModel = isContractor ? Contractor : User;
    const account = await AccountModel.findById(req.user._id);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Calculate total pending withdrawals for this user
    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { user: account._id, status: "Pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalPending =
      pendingWithdrawals.length > 0 ? pendingWithdrawals[0].total : 0;
    const availableBalance = account.walletBalance - totalPending;

    if (amt > availableBalance) {
      if (totalPending > 0) {
        return res.status(400).json({
          message: `Withdrawal already in process (Rs. ${totalPending.toLocaleString()} pending). Available balance: Rs. ${availableBalance.toLocaleString()}. Please wait until the current request is completed.`,
        });
      }
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
      `[Withdrawal] New Request by ${account.fullName} (${isContractor ? "Contractor" : "User"}) for Rs. ${amt} | Pending Total: Rs. ${totalPending + amt} | Wallet: Rs. ${account.walletBalance}`,
    );

    // ✅ NOTIFY ALL ADMINS about new withdrawal request
    const admins = await User.find({ role: "admin" });
    const adminNotifications = admins.map((admin) => ({
      user: admin._id,
      message: `New Withdrawal Request: Rs. ${amt} from ${account.fullName}`,
      type: "alert",
      relatedId: withdrawal._id,
      notifCategory: "withdrawal_request",
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json({
      ...withdrawal.toObject(),
      availableBalance: availableBalance - amt,
      totalPending: totalPending + amt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Withdrawal History
// @route   GET /api/wallet/history
const getWithdrawalHistory = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 200)
      : 50;

    const history = await Withdrawal.find({ user: req.user._id })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Pending Withdrawals (Admin)
// @route   GET /api/wallet/admin/requests
const getPendingWithdrawals = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 200)
      : 50;

    const requests = await Withdrawal.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: "user",
        select:
          "fullName email walletBalance contractorDetails paymentMethod phoneForMobileWallet ibanNumber",
        options: { lean: true },
      })
      .lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process Withdrawal (Admin Uploads Proof)
// @route   PUT /api/wallet/admin/:id
const processWithdrawal = async (req, res) => {
  try {
    const { status, transactionScreenshot, adminComment } = req.body;

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal)
      return res.status(404).json({ message: "Request not found" });

    const recipientField =
      withdrawal.userModel === "Contractor"
        ? { contractor: withdrawal.user }
        : { user: withdrawal.user };

    if (status === "Completed") {
      if (!transactionScreenshot) {
        return res
          .status(400)
          .json({ message: "Proof screenshot is required" });
      }

      // Deduct from wallet (funds were reserved but not yet deducted)
      const accountModel =
        withdrawal.userModel === "Contractor" ? Contractor : User;
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
      withdrawal.processedBy = req.user._id;
      withdrawal.adminComment = adminComment || "";

      // ✅ NOTIFY admin about completion
      const admins = await User.find({ role: "admin" });
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        message: `Withdrawal Processed: Rs. ${withdrawal.amount} sent to ${account.fullName}`,
        type: "success",
        relatedId: withdrawal._id,
        notifCategory: "withdrawal_processed",
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }

      // Notify User/Contractor
      await Notification.create({
        ...recipientField,
        message: `Withdrawal Approved! Rs. ${withdrawal.amount} sent. View proof in earnings.`,
        type: "success",
        notifCategory: "withdrawal_approved",
      });
    } else if (status === "Rejected") {
      withdrawal.status = "Rejected";
      withdrawal.processedAt = Date.now();
      withdrawal.processedBy = req.user._id;
      withdrawal.adminComment = adminComment || "";

      // ✅ NOTIFY admin about rejection
      const admins = await User.find({ role: "admin" });
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        message: `Withdrawal Rejected: Rs. ${withdrawal.amount} request`,
        type: "info",
        relatedId: withdrawal._id,
        notifCategory: "withdrawal_rejected",
      }));
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }

      await Notification.create({
        ...recipientField,
        message: `Withdrawal of Rs. ${withdrawal.amount} was rejected. Funds have been restored to your wallet.`,
        type: "error",
        notifCategory: "withdrawal_rejected",
      });
    }

    await withdrawal.save();
    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all withdrawals for admin history
// @route   GET /api/wallet/admin/history
const getAdminWithdrawalHistory = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({})
      .populate({
        path: "user",
        select: "fullName email",
      })
      .populate({
        path: "processedBy",
        select: "fullName email",
      })
      .sort({ createdAt: -1 })
      .limit(300);

    const history = withdrawals.map((w) => ({
      _id: w._id,
      amount: w.amount,
      method: w.method,
      accountDetails: w.accountDetails,
      status: w.status,
      userModel: w.userModel,
      requestedAt: w.createdAt,
      processedAt: w.processedAt,
      adminComment: w.adminComment || "",
      transactionScreenshot: w.transactionScreenshot || "",
      requester: w.user
        ? {
            _id: w.user._id,
            fullName: w.user.fullName,
            email: w.user.email,
          }
        : null,
      processedBy: w.processedBy
        ? {
            _id: w.processedBy._id,
            fullName: w.processedBy.fullName,
            email: w.processedBy.email,
          }
        : null,
    }));

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestWithdrawal,
  getWithdrawalHistory,
  getPendingWithdrawals,
  processWithdrawal,
  getAdminWithdrawalHistory,
};
