const express = require("express");
const {
    registerContractor,
    loginContractor,
    sendVerification,
    verifyAccount,
    getAllContractors,
    getContractors,
    getContractorProfile,
    getCurrentContractorProfile,
    updateContractorProfile,
    forgotPassword,
    resetPassword,
} = require("../controllers/contractorController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", registerContractor);
router.post("/login", loginContractor);

// Email verification
router.post("/verify/send", sendVerification);
router.post("/verify/confirm", verifyAccount);

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/profile", protect, getCurrentContractorProfile);

// Get contractors
router.get("/all", getAllContractors);
router.get("/", getContractors);
router.get("/:contractorId", getContractorProfile);

// Protected routes
router.put("/:id", protect, updateContractorProfile);

// Admin-only route for updating contractor settings (no auth check on contractor ownership)
router.put("/admin/:id", protect, adminOnly, updateContractorProfile);

module.exports = router;
