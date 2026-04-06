const crypto = require("crypto");
const User = require("../models/User");
const Contractor = require("../models/Contractor");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { compareFaces } = require("./faceVerificationController");

// Normalize skill strings so storage and responses stay consistent
const normalizeSkillValue = (skill) => {
  if (!skill || typeof skill !== "string") return "";
  return skill.trim().replace(/\s+/g, " ").toLowerCase();
};

// Title-case a skill for display
const formatSkillValue = (skill) => {
  const normalized = normalizeSkillValue(skill);
  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Build and email a short-lived verification token
const sendVerificationEmail = async (user) => {
  const rawToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  user.verificationToken = hashedToken;
  user.verificationTokenExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  const message = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Verify Your BuildLink Account</h2>
      <p>Use this code within 10 minutes to verify your email:</p>
      <h1 style="color: #16a34a; letter-spacing: 3px;">${rawToken}</h1>
      <p>If you did not create an account, you can ignore this email.</p>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: "BuildLink - Verify Your Account",
    message,
  });
};

// @desc    Register a new user
const registerUser = async (req, res) => {
  const {
    fullName,
    email,
    password,
    phone,
    cnic,
    address,
    location,
    role,
    contractorDetails,
    paymentMethod,
    paymentAccount,
  } = req.body;

  try {
    // ✅ Enforce minimum 8-character password length
    if (!password || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    // Validate that all required picture files are provided
    if (
      !req.files ||
      !req.files.cnicFront ||
      !req.files.cnicBack ||
      !req.files.selfie
    ) {
      return res.status(400).json({
        message:
          "All three pictures (CNIC front, CNIC back, and Selfie) are required",
      });
    }

    console.log("Files received:", {
      cnicFront: req.files.cnicFront?.[0]?.originalname,
      cnicBack: req.files.cnicBack?.[0]?.originalname,
      selfie: req.files.selfie?.[0]?.originalname,
    });

    // Upload pictures to Cloudinary
    let cnicFrontUrl, cnicBackUrl, selfieUrl;

    try {
      cnicFrontUrl = await uploadToCloudinary(
        req.files.cnicFront[0].buffer,
        "buildlink/verification/cnic_front",
        `cnic_front_${Date.now()}`,
      );
      console.log("✅ CNIC Front uploaded:", cnicFrontUrl);

      cnicBackUrl = await uploadToCloudinary(
        req.files.cnicBack[0].buffer,
        "buildlink/verification/cnic_back",
        `cnic_back_${Date.now()}`,
      );
      console.log("✅ CNIC Back uploaded:", cnicBackUrl);

      selfieUrl = await uploadToCloudinary(
        req.files.selfie[0].buffer,
        "buildlink/verification/selfie",
        `selfie_${Date.now()}`,
      );
      console.log("✅ Selfie uploaded:", selfieUrl);
    } catch (uploadError) {
      console.error("❌ Image upload failed:", uploadError.message);
      return res.status(500).json({
        message: `Image upload failed: ${uploadError.message}`,
      });
    }

    // Handle contractor registration separately
    if (role === "contractor") {
      const contractorExists = await Contractor.findOne({
        email: email.toLowerCase(),
      });
      if (contractorExists) {
        return res.status(400).json({ message: "Contractor already exists" });
      }

      const cnicExists = await Contractor.findOne({ cnic });
      if (cnicExists) {
        return res
          .status(400)
          .json({ message: "CNIC already registered to another account" });
      }

      // ── AI Face Verification (CNIC front vs Selfie) ────────────────────
      try {
        console.log("Starting AI face verification for contractor signup\u2026");
        const cnicFile = req.files.cnicFront[0];
        const selfieFile = req.files.selfie[0];

        const verdict = await compareFaces(
          cnicFile.buffer,
          cnicFile.mimetype,
          selfieFile.buffer,
          selfieFile.mimetype,
        );

        console.log("Face verification verdict:", verdict);

        const CONFIDENCE_THRESHOLD = 0.75;
        if (!verdict.isMatch || verdict.confidence < CONFIDENCE_THRESHOLD) {
          return res.status(401).json({
            message: "Identity verification failed. The face on your CNIC does not match your selfie.",
            isMatch: verdict.isMatch,
            confidence: verdict.confidence,
            reason: verdict.reason,
          });
        }

        // Store verification result to embed in the contractor record below
        var faceVerificationResult = verdict; // eslint-disable-line no-var
      } catch (verifyErr) {
        console.error("❌ Face verification error:", verifyErr.message);
        return res.status(500).json({
          message: "Identity verification service unavailable. Please try again later.",
          error: verifyErr.message,
        });
      }

      const parsedContractorDetails =
        typeof contractorDetails === "string"
          ? JSON.parse(contractorDetails)
          : contractorDetails;

      const contractorData = {
        fullName,
        email: email.toLowerCase(),
        password,
        phone,
        cnic,
        address,
        location,
        skill: formatSkillValue(parsedContractorDetails?.skill),
        skillNormalized: normalizeSkillValue(parsedContractorDetails?.skill),
        experience: parsedContractorDetails?.experience,
        teamType: parsedContractorDetails?.teamType,
        teamMembers: parsedContractorDetails?.teamMembers,
        paymentMethod: parsedContractorDetails?.paymentMethod,
        paymentAccount: parsedContractorDetails?.paymentAccount,
        phoneForMobileWallet: parsedContractorDetails?.phoneForMobileWallet,
        ibanNumber: parsedContractorDetails?.ibanNumber,
        // Add picture URLs
        cnicFront: cnicFrontUrl,
        cnicBack: cnicBackUrl,
        selfie: selfieUrl,
        // ✅ Set profile picture to selfie by default
        profilePicture: selfieUrl,
        // ✅ AI Face Verification result
        identityVerified: true,
        identityConfidence: faceVerificationResult.confidence,
        identityReason: faceVerificationResult.reason,
      };

      const contractor = await Contractor.create(contractorData);

      if (contractor) {
        sendVerificationEmail(contractor).catch((err) => {
          console.error("Verification email failed:", err.message);
        });

        const token = generateToken(res, contractor._id);
        res.status(201).json({
          _id: contractor._id,
          fullName: contractor.fullName,
          email: contractor.email,
          phone: contractor.phone,
          address: contractor.address,
          cnic: contractor.cnic,
          location: contractor.location,
          role: contractor.role,
          walletBalance: contractor.walletBalance,
          isVerified: contractor.isVerified,
          identityVerified: contractor.identityVerified,
          profilePicture: contractor.profilePicture,
          token,
          contractorDetails: {
            paymentMethod: contractor.paymentMethod,
            paymentAccount: contractor.paymentAccount,
            phoneForMobileWallet: contractor.phoneForMobileWallet,
            ibanNumber: contractor.ibanNumber,
            skill: contractor.skill,
            teamType: contractor.teamType,
            availability: contractor.availability,
            teamMembers: contractor.teamMembers,
          },
        });
      } else {
        res.status(400).json({ message: "Invalid contractor data" });
      }
      return;
    }

    // Handle regular user registration
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const cnicExists = await User.findOne({ cnic });
    if (cnicExists) {
      return res
        .status(400)
        .json({ message: "CNIC already registered to another account" });
    }

    let safeRole = role;
    if (safeRole === "admin") safeRole = "user";

    const userData = {
      fullName,
      email: email.toLowerCase(),
      password,
      phone,
      cnic,
      address,
      location: location,
      role: safeRole,
      paymentMethod,
      paymentAccountValue: paymentAccount,
      // Add picture URLs
      cnicFront: cnicFrontUrl,
      cnicBack: cnicBackUrl,
      selfie: selfieUrl,
      // ✅ Set profile picture to selfie by default
      profilePicture: selfieUrl,
    };

    console.log("Creating User with data:", userData);

    const user = await User.create(userData);

    console.log("✅ User created:", {
      id: user._id,
      paymentMethod: user.paymentMethod,
      paymentAccountValue: user.paymentAccountValue,
    });

    if (user) {
      // Send verification email but do not block signup on email failure
      sendVerificationEmail(user).catch((err) => {
        console.error("Verification email failed:", err.message);
      });

      const token = generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        location: user.location,
        cnic: user.cnic,
        role: user.role,
        paymentMethod: user.paymentMethod,
        paymentAccountValue: user.paymentAccountValue,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        token,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("Login attempt for email:", email);

    // Try to find user first
    let user = await User.findOne({ email: email.toLowerCase() });
    let isContractor = false;

    console.log("User found in User model:", user ? "YES" : "NO");

    // If not found in User, try Contractor
    if (!user) {
      user = await Contractor.findOne({ email: email.toLowerCase() });
      isContractor = true;
      console.log("User found in Contractor model:", user ? "YES" : "NO");
    }

    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("Checking password for user:", user.email);
    const passwordMatch = await user.matchPassword(password);
    console.log("Password match result:", passwordMatch);

    if (!passwordMatch) {
      console.log(" Password does not match");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(res, user._id);

    // Return appropriate data based on user type
    if (isContractor) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        location: user.location,
        cnic: user.cnic,
        role: user.role,
        skill: user.skill,
        experience: user.experience,
        availability: user.availability,
        teamType: user.teamType,
        walletBalance: user.walletBalance,
        rating: user.rating,
        totalReviews: user.totalReviews,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        token,
        contractorDetails: {
          paymentMethod: user.paymentMethod,
          paymentAccount: user.paymentAccount,
          phoneForMobileWallet: user.phoneForMobileWallet,
          ibanNumber: user.ibanNumber,
          skill: user.skill,
          teamType: user.teamType,
          availability: user.availability,
          teamMembers: user.teamMembers,
        },
      });
    } else {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        location: user.location,
        cnic: user.cnic,
        role: user.role,
        walletBalance: user.walletBalance || 0,
        paymentMethod: user.paymentMethod,
        paymentAccountValue: user.paymentAccountValue,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        token,
      });
    }
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
const logoutUser = (req, res) => {
  const frontendUrls = (process.env.FRONTEND_URLS || "")
    .split(",")
    .map((url) => url.trim().toLowerCase())
    .filter(Boolean);
  const hasRemoteFrontend = frontendUrls.some(
    (url) => !url.includes("localhost") && !url.includes("127.0.0.1"),
  );
  const useCrossSiteCookies =
    process.env.COOKIE_CROSS_SITE === "true" ||
    process.env.NODE_ENV === "production" ||
    hasRemoteFrontend;

  res.cookie("jwt", "", {
    httpOnly: true,
    secure: useCrossSiteCookies,
    sameSite: useCrossSiteCookies ? "none" : "strict",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Send email verification code
const sendVerification = async (req, res) => {
  const { email } = req.body;

  try {
    // Try User first
    let user = await User.findOne({ email: email.toLowerCase() });

    // If not found, try Contractor
    if (!user) {
      user = await Contractor.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: "Account already verified" });
    }

    await sendVerificationEmail(user);
    res.status(200).json({ message: "Verification code sent to email" });
  } catch (error) {
    console.error("Send Verification Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm email verification
const verifyAccount = async (req, res) => {
  const { email, token } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Try User first
    let user = await User.findOne({
      email: email.toLowerCase(),
      verificationToken: hashedToken,
      verificationTokenExpire: { $gt: Date.now() },
    });

    // If not found, try Contractor
    if (!user) {
      user = await Contractor.findOne({
        email: email.toLowerCase(),
        verificationToken: hashedToken,
        verificationTokenExpire: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    console.error("Verify Account Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Try User first
    let user = await User.findOne({ email: email.toLowerCase() });

    // If not found, try Contractor
    if (!user) {
      user = await Contractor.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #3b82f6;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "BuildLink - Password Reset OTP",
        message,
      });

      res.status(200).json({ message: "OTP sent to your email!" });
    } catch (err) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res
        .status(500)
        .json({ message: "Email could not be sent. Server Error." });
    }
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password with OTP
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({
      message: "New password is required.",
    });
  }

  // ✅ Enforce minimum 8-character password length
  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Try User first
    let user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOtp: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    // If not found, try Contractor
    if (!user) {
      user = await Contractor.findOne({
        email: email.toLowerCase(),
        resetPasswordOtp: hashedOtp,
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid or Expired OTP" });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res
      .status(200)
      .json({ message: "Password updated successfully! Login now." });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  sendVerification,
  verifyAccount,
  forgotPassword,
  resetPassword,
};
