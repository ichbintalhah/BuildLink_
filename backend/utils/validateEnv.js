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

  for (const varName of requiredVars) {
    const value = process.env[varName];

    if (!value) {
      missingVars.push(varName);
    } else {
      // Validate specific variables
      if (varName === "MONGO_URI") {
        validateMongoUri(value);
      } else if (varName === "JWT_SECRET" && value.length < 16) {
        warnings.push(
          "JWT_SECRET is too short (< 16 chars) - recommended 32+ chars",
        );
      }
    }
  }

  if (missingVars.length > 0) {
    console.error(
      `Missing ${missingVars.length} required environment variable(s):`,
    );
    missingVars.forEach((v) => console.error(`   - ${v}`));
    console.error("Please set these variables in your .env file");
    return false;
  }

  if (warnings.length > 0) {
    console.warn("Environment warnings:");
    warnings.forEach((w) => console.warn(`   - ${w}`));
  }

  return true;
};

const validateMongoUri = (uri) => {
  // Check if it's a valid connection string
  if (!uri.includes("mongodb")) {
    console.warn("MONGO_URI may be invalid: must start with 'mongodb' or 'mongodb+srv'");
  }

  if (!uri.includes("://")) {
    console.warn("MONGO_URI format looks invalid");
  }
};

module.exports = validateEnv;
