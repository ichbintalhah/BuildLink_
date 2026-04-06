const User = require("../models/User");
const Contractor = require("../models/Contractor");
const Review = require("../models/Review");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// Normalize skill strings so filters are consistent
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

const getAllUsers = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 200)
      : 50;

    const users = await User.find({ role: "user" })
      .select(
        "fullName email phone cnic createdAt profilePicture selfie cnicFront cnicBack paymentMethod paymentAccountValue walletBalance",
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllContractors = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 200)
      : 50;

    const contractors = await Contractor.find()
      .select(
        "fullName email phone skill availability availabilityStatus isTrusted createdAt profilePicture selfie cnicFront cnicBack walletBalance",
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getContractors = async (req, res) => {
  try {
    const { skill } = req.query;
    let query = {};

    const normalizedSkill = normalizeSkillValue(skill);

    if (normalizedSkill) {
      // Prefer normalized field; keep legacy skill regex as fallback
      query.$or = [
        { skillNormalized: normalizedSkill },
        { skill: { $regex: new RegExp(`^${normalizedSkill}$`, "i") } },
      ];
    }

    let contractors = await Contractor.find(query).select("-password");

    // Extra safety: filter in JS to avoid stray mis-categorized contractors
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
        // Ensure the outward skill value is formatted
        cObj.skill = formatSkillValue(cObj.skill);
        return cObj;
      }),
    );

    res.json(contractorsWithRating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const body = req.body;

    // If contractor, update Contractor collection and map fields to contractorDetails shape
    if (req.user.role === "contractor") {
      const updates = {};
      if (body.fullName !== undefined) updates.fullName = body.fullName;
      if (body.phone !== undefined) updates.phone = body.phone;
      if (body.address !== undefined) updates.address = body.address;
      if (body.location !== undefined) updates.location = body.location;

      if (body.contractorDetails) {
        const cd = body.contractorDetails;
        if (cd.skill) {
          updates.skill = formatSkillValue(cd.skill);
          updates.skillNormalized = normalizeSkillValue(cd.skill);
        }
        if (cd.teamType) updates.teamType = cd.teamType;
        if (cd.paymentMethod) updates.paymentMethod = cd.paymentMethod;
        if (cd.paymentAccount) updates.paymentAccount = cd.paymentAccount;
        if (cd.phoneForMobileWallet)
          updates.phoneForMobileWallet = cd.phoneForMobileWallet;
        if (cd.ibanNumber) updates.ibanNumber = cd.ibanNumber;
        if (cd.teamMembers) updates.teamMembers = cd.teamMembers;
        if (cd.availability) updates.availability = cd.availability;
      }

      const updatedContractor = await Contractor.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: false },
      ).select("-password");

      return res.json({
        ...updatedContractor.toObject(),
        contractorDetails: {
          paymentMethod: updatedContractor.paymentMethod,
          paymentAccount: updatedContractor.paymentAccount,
          phoneForMobileWallet: updatedContractor.phoneForMobileWallet,
          ibanNumber: updatedContractor.ibanNumber,
          skill: updatedContractor.skill,
          teamType: updatedContractor.teamType,
          availability: updatedContractor.availability,
          teamMembers: updatedContractor.teamMembers,
        },
      });
    }

    // Default: normal user profile update
    const updates = {};
    if (body.fullName !== undefined) updates.fullName = body.fullName;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.address !== undefined) updates.address = body.address;
    if (body.location !== undefined) updates.location = body.location;
    if (body.cnic !== undefined) updates.cnic = body.cnic;
    if (body.paymentMethod !== undefined)
      updates.paymentMethod = body.paymentMethod;
    if (body.paymentAccountValue)
      updates.paymentAccountValue = body.paymentAccountValue;

    if (body.contractorDetails) {
      const cd = body.contractorDetails;
      if (cd.skill)
        updates["contractorDetails.skill"] = formatSkillValue(cd.skill);
      if (cd.availability)
        updates["contractorDetails.availability"] = cd.availability;
      if (cd.teamType) updates["contractorDetails.teamType"] = cd.teamType;
      if (cd.paymentMethod)
        updates["contractorDetails.paymentMethod"] = cd.paymentMethod;
      if (cd.paymentAccount)
        updates["contractorDetails.paymentAccount"] = cd.paymentAccount;
      if (cd.paymentMethod) updates.paymentMethod = cd.paymentMethod;
      if (cd.paymentAccount || cd.phoneForMobileWallet || cd.ibanNumber) {
        updates.paymentAccountValue =
          cd.paymentAccount || cd.phoneForMobileWallet || cd.ibanNumber;
      }
      if (cd.phoneForMobileWallet)
        updates["contractorDetails.phoneForMobileWallet"] =
          cd.phoneForMobileWallet;
      if (cd.ibanNumber)
        updates["contractorDetails.ibanNumber"] = cd.ibanNumber;
      if (cd.teamMembers)
        updates["contractorDetails.teamMembers"] = cd.teamMembers;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: false },
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Update Failed", error: error.message });
  }
};

// @desc    Update profile picture for user or contractor
// @route   PUT /api/user/profile-picture
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let profilePictureUrl;

    // Check if file was uploaded via multer
    if (req.file) {
      // Upload to Cloudinary
      const fileName = `profile_${userId}_${Date.now()}`;
      profilePictureUrl = await uploadToCloudinary(
        req.file.buffer,
        "profile-pictures",
        fileName,
      );
    } else if (req.body.profilePictureUrl) {
      // Fallback: accept direct URL (for backward compatibility)
      profilePictureUrl = req.body.profilePictureUrl;
    } else {
      return res
        .status(400)
        .json({ message: "Profile picture file or URL is required" });
    }

    // Try to update User first
    let user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePictureUrl },
      { new: true },
    ).select("-password");

    // If not found in User, try Contractor
    if (!user) {
      user = await Contractor.findByIdAndUpdate(
        userId,
        { profilePicture: profilePictureUrl },
        { new: true },
      ).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // console.log("✅ Profile picture updated:", {
    //   userId,
    //   profilePicture: profilePictureUrl,
    // });

    res.json({
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture,
      user, // Return full user object so frontend can update context
    });
  } catch (error) {
    console.error("Profile Picture Update Error:", error);
    res.status(500).json({ message: "Update Failed", error: error.message });
  }
};

module.exports = {
  getContractors,
  getContractorProfile,
  getCurrentUserProfile,
  updateUserProfile,
  calculateContractorRating,
  getAllUsers,
  getAllContractors,
  updateProfilePicture,
};
