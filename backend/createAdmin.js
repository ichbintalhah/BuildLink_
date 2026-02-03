const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const createAdmin = async () => {
  try {
    // 1. Check if Admin already exists
    const adminExists = await User.findOne({ email: "admin@buildlink.com" });
    if (adminExists) {
      console.log("⚠️ Admin already exists!");
      process.exit();
    }

    // 2. Create Admin User with plain-text password
    // PASSWORD WILL BE HASHED BY User.pre('save') HOOK BEFORE DB STORAGE
    // Do NOT hash here - let the schema handle it to avoid double-hashing
    const admin = await User.create({
      fullName: "Super Admin",
      email: "admin@buildlink.com",
      password: "admin123", // Plain-text - will be hashed by pre-save hook
      phone: "03001234567", // Dummy phone
      cnic: "00000-0000000-0",
      address: "BuildLink HQ",
      role: "admin",
      isVerified: true,
    });

    console.log("✅ Admin Account Created Successfully!");
    console.log("📧 Email: admin@buildlink.com");
    console.log("🔑 Password: admin123");

    process.exit();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createAdmin();
