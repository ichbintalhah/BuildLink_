const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Check if MONGO_URI is properly set
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is not defined in .env file!");
      console.error(
        "   Please ensure your .env file contains MONGO_URI variable.",
      );
      process.exit(1);
    }

    // MongoDB connection with retry logic
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Connection options for stability
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true,
      w: "majority",
      // Automatically reconnect on connection lost
      autoIndex: false,
      maxIdleTimeMS: 30000,
    });

    console.log(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`,
    );

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected, attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });

    mongoose.connection.on("error", (err) => {
      console.error(" MongoDB connection error:", err.message);
    });

    return conn;
  } catch (error) {
    console.error("MongoDB connection failed");
    process.exit(1);
  }
};

module.exports = connectDB;
