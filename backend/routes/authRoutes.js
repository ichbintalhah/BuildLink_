const express = require("express");
const multer = require("multer");
const {
  registerUser,
  loginUser,
  logoutUser,
  sendVerification,
  verifyAccount,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const router = express.Router();

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Signup route with file upload for verification pictures
router.post(
  "/signup",
  upload.fields([
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  registerUser,
);

router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Email verification
router.post("/verify/send", sendVerification);
router.post("/verify/confirm", verifyAccount);

// OTP Routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
