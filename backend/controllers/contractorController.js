const crypto = require("crypto");
const Contractor = require("../models/Contractor");
const Review = require("../models/Review");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

// Normalize skill strings so filtering stays consistent (trim + lowercase)
const normalizeSkillValue = (skill) => {
  if (!skill || typeof skill !== "string") return "";
  return skill.trim().replace(/\s+/g, " ").toLowerCase();
};

// Presentable skill text (title case) after normalization
const formatSkillValue = (skill) => {
  const normalized = normalizeSkillValue(skill);
  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper: Calculate Rating dynamically
const calculateContractorRating = async (contractorId) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          contractor: new (require("mongoose").Types.ObjectId)(contractorId),
        },
      },
      {
        $group: {
          _id: "$contractor",
          averageRating: { $avg: "$rating" },
          numReviews: { $sum: 1 },
        },
      },
    ]);
    return stats.length > 0
      ? {
          rating: parseFloat(stats[0].averageRating.toFixed(1)),
          totalReviews: stats[0].numReviews,
        }
      : { rating: 0, totalReviews: 0 };
  } catch (error) {
    console.error(error);
    return { rating: 0, totalReviews: 0 };
  }
};

// Build and email a short-lived verification token
const sendVerificationEmail = async (contractor) => {
  const rawToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  contractor.verificationToken = hashedToken;
  contractor.verificationTokenExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await contractor.save({ validateBeforeSave: false });

  const message = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Verify Your BuildLink Contractor Account</h2>
      <p>Use this code within 10 minutes to verify your email:</p>
      <h1 style="color: #16a34a; letter-spacing: 3px;">${rawToken}</h1>
      <p>If you did not create an account, you can ignore this email.</p>
    </div>
  `;

  await sendEmail({
    email: contractor.email,
    subject: "BuildLink - Verify Your Contractor Account",
    message,
  });
};

// @desc    Register a new contractor
const registerContractor = async (req, res) => {
  const {
    fullName,
    email,
    password,
    phone,
    cnic,
    address,
    skill,
    experience,
    teamType,
    teamMembers,
    paymentMethod,
    paymentAccount,
    phoneForMobileWallet,
    ibanNumber,
  } = req.body;

  try {
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

    const contractorData = {
      fullName,
      email: email.toLowerCase(),
      password,
      phone,
      cnic,
      address,
      // Store a normalized, predictable skill value
      skill: formatSkillValue(skill),
      skillNormalized: normalizeSkillValue(skill),
      experience,
      teamType,
      teamMembers,
      paymentMethod,
      paymentAccount,
      phoneForMobileWallet,
      ibanNumber,
    };

    const contractor = await Contractor.create(contractorData);

    if (contractor) {
      await sendVerificationEmail(contractor);

      res.status(201).json({
        _id: contractor._id,
        fullName: contractor.fullName,
        email: contractor.email,
        role: contractor.role,
        token: generateToken(contractor._id),
        message: "Registration successful! Verification email sent.",
      });
    }
  } catch (error) {
    console.error("Register Contractor Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login contractor
const loginContractor = async (req, res) => {
  const { email, password } = req.body;

  try {
    const contractor = await Contractor.findOne({ email: email.toLowerCase() });

    if (contractor && (await contractor.matchPassword(password))) {
      res.json({
        _id: contractor._id,
        fullName: contractor.fullName,
        email: contractor.email,
        role: contractor.role,
        isVerified: contractor.isVerified,
        token: generateToken(contractor._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login Contractor Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send verification email
const sendVerification = async (req, res) => {
  const { email } = req.body;

  try {
    const contractor = await Contractor.findOne({ email: email.toLowerCase() });
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }

    if (contractor.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    await sendVerificationEmail(contractor);
    res.json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Send Verification Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify contractor account
const verifyAccount = async (req, res) => {
  const { email, token } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const contractor = await Contractor.findOne({
      email: email.toLowerCase(),
      verificationToken: hashedToken,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!contractor) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    contractor.isVerified = true;
    contractor.verificationToken = undefined;
    contractor.verificationTokenExpire = undefined;
    await contractor.save();

    res.json({
      message: "Account verified successfully!",
      isVerified: true,
    });
  } catch (error) {
    console.error("Verify Account Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all contractors
const getAllContractors = async (req, res) => {
  try {
    const contractors = await Contractor.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get contractors with filters
const getContractors = async (req, res) => {
  try {
    const { skill, availability } = req.query;
    let query = {};

    const normalizedSkill = normalizeSkillValue(skill);

    if (normalizedSkill) {
      // Prefer normalized field; keep legacy skill regex as fallback
      query.$or = [
        { skillNormalized: normalizedSkill },
        { skill: { $regex: new RegExp(`^${normalizedSkill}$`, "i") } },
      ];
    }

    if (availability) {
      query.availability = availability;
    }

    let contractors = await Contractor.find(query).select("-password -phone");

    // Defensive filter: enforce normalized skill match to avoid mis-filed listings
    if (normalizedSkill) {
      contractors = contractors.filter(
        (c) =>
          normalizeSkillValue(c.skillNormalized || c.skill) === normalizedSkill,
      );
    }

    const contractorsWithRating = await Promise.all(
      contractors.map(async (c) => {
        const cObj = c.toObject();
        const rating = await calculateContractorRating(c._id);
        cObj.rating = rating.rating;
        cObj.totalReviews = rating.totalReviews;
        cObj.skill = formatSkillValue(cObj.skill);
        return cObj;
      }),
    );

    res.json(contractorsWithRating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get contractor profile
const getContractorProfile = async (req, res) => {
  try {
    const { contractorId } = req.params;
    const contractor =
      await Contractor.findById(contractorId).select("-password");

    if (!contractor)
      return res.status(404).json({ message: "Contractor not found" });

    const rating = await calculateContractorRating(contractorId);
    res.json({ ...contractor.toObject(), ...rating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged-in contractor profile
const getCurrentContractorProfile = async (req, res) => {
  try {
    const contractor = await Contractor.findById(req.user._id).select(
      "-password",
    );

    if (!contractor)
      return res.status(404).json({ message: "Contractor not found" });

    const rating = await calculateContractorRating(req.user._id);
    res.json({ ...contractor.toObject(), ...rating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update contractor profile
const updateContractorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const contractor = await Contractor.findById(id);

    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }

    const {
      fullName,
      phone,
      address,
      skill,
      experience,
      availability,
      teamType,
      teamMembers,
      paymentMethod,
      paymentAccount,
      phoneForMobileWallet,
      ibanNumber,
      availabilityStatus,
      isTrusted,
      location,
    } = req.body;

    if (fullName) contractor.fullName = fullName;
    if (phone) contractor.phone = phone;
    if (address) contractor.address = address;
    if (skill) {
      contractor.skill = formatSkillValue(skill);
      contractor.skillNormalized = normalizeSkillValue(skill);
    }
    if (experience) contractor.experience = experience;
    if (availability) contractor.availability = availability;
    if (teamType) contractor.teamType = teamType;
    if (teamMembers) contractor.teamMembers = teamMembers;
    if (paymentMethod) contractor.paymentMethod = paymentMethod;
    if (paymentAccount) contractor.paymentAccount = paymentAccount;
    if (phoneForMobileWallet)
      contractor.phoneForMobileWallet = phoneForMobileWallet;
    if (ibanNumber) contractor.ibanNumber = ibanNumber;

    // Sync availabilityStatus with availability field for backward compatibility
    if (availabilityStatus) {
      contractor.availabilityStatus = availabilityStatus;
      // Sync with old availability field: Available -> Green, Busy -> Red
      contractor.availability =
        availabilityStatus === "Available" ? "Green" : "Red";
    }

    if (isTrusted !== undefined) contractor.isTrusted = isTrusted;
    if (location) contractor.location = location;

    await contractor.save();

    res.json({
      message: "Profile updated successfully",
      contractor: {
        ...contractor.toObject(),
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Update Contractor Profile Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password - Send OTP
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const contractor = await Contractor.findOne({ email: email.toLowerCase() });
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    contractor.resetPasswordOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    contractor.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await contractor.save({ validateBeforeSave: false });

    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Reset Your BuildLink Password</h2>
        <p>Your OTP to reset your password (valid for 10 minutes):</p>
        <h1 style="color: #16a34a; letter-spacing: 3px;">${otp}</h1>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      email: contractor.email,
      subject: "BuildLink - Password Reset OTP",
      message,
    });

    res.json({ message: "OTP sent to email successfully" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password with OTP
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const contractor = await Contractor.findOne({
      email: email.toLowerCase(),
      resetPasswordOtp: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!contractor) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    contractor.password = newPassword;
    contractor.resetPasswordOtp = undefined;
    contractor.resetPasswordExpire = undefined;
    await contractor.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
