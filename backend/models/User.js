const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
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
      enum: ["user", "admin"],
      default: "user",
    },
    paymentMethod: { type: String }, // EasyPaisa, JazzCash, SadaPay, NayaPay, Bank Account
    paymentAccountValue: { type: String }, // Phone or IBAN based on method

    // ✅ Wallet Balance (for refunds and withdrawals)
    walletBalance: { type: Number, default: 0 },

    // ✅ NEW: Identity Verification Pictures (Cloudinary URLs)
    cnicFront: { type: String }, // CNIC Front Picture URL
    cnicBack: { type: String }, // CNIC Back Picture URL
    selfie: { type: String }, // Selfie/Face Picture URL

    // ✅ NEW: Profile Picture (automatically set from selfie, can be changed)
    profilePicture: { type: String }, // User's profile picture URL (defaults to selfie)

    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpire: { type: Date },

    // ✅ NEW: OTP Fields for Forgot Password
    resetPasswordOtp: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true },
);

// Password Hashing Middleware
userSchema.pre("save", async function () {
  // Skip re-hashing if password not changed (prevents double-hash on unrelated saves)
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password Comparison Method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
