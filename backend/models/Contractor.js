const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const contractorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    location: { type: String }, // City / Area / Address for job requests
    role: {
      type: String,
      default: "contractor",
    },
    paymentMethod: { type: String, default: "Not Set" },
    paymentAccount: { type: String, default: "" },
    // Admin Controls
    availabilityStatus: {
      type: String,
      enum: ["Available", "Busy"],
      default: "Available",
    },
    isTrusted: { type: Boolean, default: false },

    // Wallet for Earnings
    walletBalance: { type: Number, default: 0 },

    // Contractor Specifics
    skill: { type: String },
    // Lower-cased, trimmed skill for consistent filtering
    skillNormalized: { type: String, index: true },
    experience: { type: String },
    availability: { type: String, default: "Green" }, // Green (Free), Red (Busy)
    teamType: { type: String, default: "Individual" },
    teamMembers: [
      {
        name: { type: String },
        skill: { type: String },
      },
    ],
    paymentMethod: { type: String }, // EasyPaisa, JazzCash, Sadapay, Nayapay, Bank Account
    paymentAccount: { type: String }, // IBAN for Bank, Phone for mobile wallets
    phoneForMobileWallet: { type: String }, // Phone number for EasyPaisa/JazzCash/Sadapay/Nayapay
    ibanNumber: { type: String }, // IBAN number for Bank Account

    // ✅ NEW: Identity Verification Pictures (Cloudinary URLs)
    cnicFront: { type: String }, // CNIC Front Picture URL
    cnicBack: { type: String }, // CNIC Back Picture URL
    selfie: { type: String }, // Selfie/Face Picture URL

    // ✅ NEW: Profile Picture (automatically set from selfie, can be changed)
    profilePicture: { type: String }, // Contractor's profile picture URL (defaults to selfie)

    // Contractor portfolio images stored from Cloudinary uploads
    portfolio: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    // Reviews
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    // Identity verification via AI face-match (CNIC vs Selfie)
    identityVerified: { type: Boolean, default: false },
    identityConfidence: { type: Number, default: 0 },
    identityReason: { type: String, default: "" },

    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpire: { type: Date },

    // OTP Fields for Forgot Password
    resetPasswordOtp: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true },
);

// Password Hashing Middleware
contractorSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Normalize skill before saving so queries stay consistent
contractorSchema.pre("save", function () {
  if (this.isModified("skill")) {
    const normalized = (this.skill || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
    this.skillNormalized = normalized;
  }
});

// Password Comparison Method
contractorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Contractor", contractorSchema);
