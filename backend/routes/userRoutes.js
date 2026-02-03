const express = require("express");
const {
  getContractors,
  getContractorProfile,
  getCurrentUserProfile,
  updateUserProfile,
  getAllUsers,
  getAllContractors,
  updateProfilePicture,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", getContractors); // GET /api/users?role=contractor for finding all contractors
router.get("/contractors", getContractors); // GET /api/users/contractors?skill=xxx for finding by skill
router.get("/profile", protect, getCurrentUserProfile); // AVAILABILITY FIX: GET /api/users/profile for fetching current user
router.get("/contractor/:contractorId", getContractorProfile); // FIX BUG 2: GET /api/users/contractor/:id for viewing contractor profile

// Admin routes
router.get("/admin/users", protect, adminOnly, getAllUsers); // All users
router.get("/admin/contractors", protect, adminOnly, getAllContractors); // All contractors

router.put("/profile", protect, updateUserProfile); // <--- New Profile Update Route
router.put("/profile-picture", protect, updateProfilePicture); // <--- Update Profile Picture Route

module.exports = router;
