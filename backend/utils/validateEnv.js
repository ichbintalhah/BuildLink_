/**
 * Environment Variable Validator
 * Ensures all required environment variables are properly configured
 */

const validateEnv = () => {
  const requiredVars = [
    "PORT",
    "MONGO_URI",
    "JWT_SECRET",
    "GEMINI_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "EMAIL_USER",
    "EMAIL_PASS",
  ];

  const missingVars = [];
  const warnings = [];

  console.log("\n" + "=".repeat(60));
  console.log("🔍 Environment Configuration Check");
  console.log("=".repeat(60));

  for (const varName of requiredVars) {
    const value = process.env[varName];

    if (!value) {
      missingVars.push(varName);
      console.log(`❌ ${varName}: NOT SET`);
    } else {
      // Mask sensitive values for security
      const masked = maskValue(varName, value);
      console.log(`✅ ${varName}: ${masked}`);

      // Validate specific variables
      if (varName === "MONGO_URI") {
        validateMongoUri(value);
      } else if (varName === "JWT_SECRET" && value.length < 16) {
        warnings.push(
          "JWT_SECRET is too short (< 16 chars) - recommended 32+ chars"
        );
      }
    }
  }

  console.log("=".repeat(60));

  if (missingVars.length > 0) {
    console.error(
      `\n⚠️  Missing ${missingVars.length} required environment variable(s):`
    );
    missingVars.forEach((v) => console.error(`   - ${v}`));
    console.error("\n📋 Please set these variables in your .env file\n");
    return false;
  }

  if (warnings.length > 0) {
    console.warn("\n⚠️  Warnings:");
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn();
  }

  console.log("✅ All required environment variables are set!\n");
  return true;
};

const maskValue = (varName, value) => {
  // Don't mask non-sensitive values
  if (["PORT", "NODE_ENV", "CLOUDINARY_CLOUD_NAME"].includes(varName)) {
    return value;
  }

  // For sensitive values, show first 4 and last 4 chars
  if (value.length <= 8) {
    return "***" + value.slice(-1);
  }

  return value.slice(0, 4) + "..." + value.slice(-4);
};

const validateMongoUri = (uri) => {
  console.log("\n📊 MongoDB URI Analysis:");

  // Check if it's a valid connection string
  if (!uri.includes("mongodb")) {
    console.warn("   ⚠️  URI doesn't start with 'mongodb' or 'mongodb+srv'");
  }

  if (!uri.includes("://")) {
    console.warn("   ⚠️  Invalid MongoDB connection string format");
  }

  // Extract hostname
  const hostMatch = uri.match(/@([^/?]+)/);
  if (hostMatch) {
    console.log(`   ✅ Host: ${hostMatch[1].split(",")[0]}`);
  }

  // Extract database name
  const dbMatch = uri.match(/\/([^/?]+)(\?|$)/);
  if (dbMatch) {
    console.log(`   ✅ Database: ${dbMatch[1]}`);
  }

  // Check for SRV vs standard
  if (uri.includes("mongodb+srv")) {
    console.log("   ✅ Using MongoDB Atlas SRV connection (recommended)");
  } else {
    console.log("   ℹ️  Using standard MongoDB connection");
  }
};

module.exports = validateEnv;
