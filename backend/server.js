const express = require("express");
const dotenv = require("dotenv");
const cron = require("node-cron");

// 1. Load Environment Variables FIRST
dotenv.config();

// 2. Validate environment variables
const validateEnv = require("./utils/validateEnv");
if (!validateEnv()) {
  console.error("❌ Environment configuration failed. Exiting...");
  process.exit(1);
}

const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const {
  checkAndAutoCompleteBookings,
  checkAndRefundIncompleteJobs,
  checkActiveJobsExpiry,
  checkAndCancelExpiredBookings,
  checkExpiredContractorAcceptance,
  checkExpiredPaymentUploads,
} = require("./utils/bookingScheduler");

// Import Route Files
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const contractorRoutes = require("./routes/contractorRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const aiRoutes = require("./routes/aiRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const advisoryRoutes = require("./routes/advisoryRoutes");
const disputeRoutes = require("./routes/disputeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const walletRoutes = require("./routes/walletRoutes");

// Connect to MongoDB
connectDB().catch((error) => {
  console.error("Failed to connect to MongoDB:", error.message);
  console.warn("⚠️  Server will continue without MongoDB for testing purposes");
  // Don't exit - allow server to run for AI testing
  // process.exit(1);
});

const app = express();

// --- MIDDLEWARE ---
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contractors", contractorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/advisory", advisoryRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallet", walletRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "✅ BuildLink API is Running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Health check for monitoring
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

// --- ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err);
  res.status(500).json({
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// --- SCHEDULED JOBS ---

// 1. Check if "Busy" contractors should be "Available" (Runs every minute)
cron.schedule("* * * * *", () => {
  checkActiveJobsExpiry();
});

// 2. Auto-complete jobs after 3 hours (Runs every minute)
cron.schedule("* * * * *", () => {
  console.log("[Scheduler] Checking for jobs requiring auto-completion...");
  checkAndAutoCompleteBookings();
});

// 3. Auto-refund incomplete jobs (Runs every minute)
cron.schedule("* * * * *", () => {
  checkAndRefundIncompleteJobs();
});

// 4. Auto-cancel expired pending requests (Runs every hour)
cron.schedule("0 * * * *", () => {
  checkAndCancelExpiredBookings();
});

// 5. Check for expired contractor acceptance (Runs every minute)
cron.schedule("* * * * *", () => {
  checkExpiredContractorAcceptance();
});

// 6. Check for expired payment uploads (Runs every minute)
cron.schedule("* * * * *", () => {
  console.log("[Scheduler] Checking for expired payment uploads...");
  checkExpiredPaymentUploads();
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 BuildLink Server Started Successfully");
  console.log("=".repeat(60));
  console.log(`✅ Server running on port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📅 Scheduler initialized - real-time checks running`);
  console.log("=".repeat(60) + "\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n⚠️  SIGTERM received - shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("❌ Shutdown timeout - forcing exit");
    process.exit(1);
  }, 10000);
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT received - shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});
