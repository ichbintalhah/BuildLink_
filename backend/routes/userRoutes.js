const express = require("express");
const multer = require("multer");
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

// Configure multer for profile picture upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.get("/", getContractors); // GET /api/users?role=contractor for finding all contractors
router.get("/contractors", getContractors); // GET /api/users/contractors?skill=xxx for finding by skill
router.get("/profile", protect, getCurrentUserProfile); // AVAILABILITY FIX: GET /api/users/profile for fetching current user
router.get("/contractor/:contractorId", getContractorProfile); // FIX BUG 2: GET /api/users/contractor/:id for viewing contractor profile

// Admin routes
router.get("/admin/users", protect, adminOnly, getAllUsers); // All users
router.get("/admin/contractors", protect, adminOnly, getAllContractors); // All contractors

router.put(
  "/profile",
  protect,
  upload.fields([{ name: "portfolioImages", maxCount: 20 }]),
  updateUserProfile,
); // Supports contractor portfolio uploads + profile updates
router.put("/profile-picture", protect, upload.single("profilePicture"), updateProfilePicture); // <--- Update Profile Picture Route

module.exports = router;
