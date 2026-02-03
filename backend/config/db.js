const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Check if MONGO_URI is properly set
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is not defined in .env file!");
      console.error(
        "   Please ensure your .env file contains MONGO_URI variable."
      );
      process.exit(1);
    }

    // MongoDB connection with retry logic
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Connection options for stability
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true,
      w: "majority",
      // Automatically reconnect on connection lost
      autoIndex: false,
      maxIdleTimeMS: 30000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Status: Connected & Ready`);

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected - attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });

    return conn;
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ MongoDB Connection Failed");
    console.error("=".repeat(60));
    console.error(`Error: ${error.message}`);

    // Detailed error diagnosis
    if (error.message.includes("ENOTFOUND")) {
      console.error("\n📍 Diagnosis: DNS Resolution Failed");
      console.error("   Possible causes:");
      console.error("   1. Invalid MongoDB Atlas hostname in MONGO_URI");
      console.error("   2. Network connectivity issues");
      console.error("   3. MongoDB Atlas cluster does not exist");
      console.error("   4. IP whitelist not configured in MongoDB Atlas");
    } else if (error.message.includes("authentication failed")) {
      console.error("\n📍 Diagnosis: Authentication Failed");
      console.error("   Possible causes:");
      console.error("   1. Invalid MongoDB username or password");
      console.error("   2. User does not have access to this database");
      console.error("   3. User password contains special characters");
    } else if (error.message.includes("connect ECONNREFUSED")) {
      console.error("\n📍 Diagnosis: Connection Refused");
      console.error("   Possible causes:");
      console.error("   1. MongoDB server is not running");
      console.error("   2. MongoDB Atlas cluster is paused or down");
      console.error("   3. Incorrect host or port");
    } else if (error.message.includes("ETIMEDOUT")) {
      console.error("\n📍 Diagnosis: Connection Timeout");
      console.error("   Possible causes:");
      console.error("   1. Network connectivity issues");
      console.error("   2. Firewall blocking MongoDB port");
      console.error("   3. MongoDB server is overloaded");
    }

    console.error("\n💡 Solution Steps:");
    console.error("   1. Verify MONGO_URI in .env file");
    console.error("   2. Check MongoDB Atlas cluster status");
    console.error("   3. Add current IP to MongoDB Atlas IP Whitelist");
    console.error(
      "   4. Verify username and password are URL-encoded if needed"
    );
    console.error("   5. Test connection manually using MongoDB Compass");
    console.error("=".repeat(60) + "\n");

    // Exit process after 5 seconds to allow logs to flush
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
};

module.exports = connectDB;
