// testGemini.js - Quick test script for Gemini API
// Run with: node testGemini.js

require("dotenv").config({ quiet: true });
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("Testing Gemini API Setup...\n");

// Check 1: API Key exists
console.log("Step 1: Checking API Key...");
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not found in .env file!");
  console.error("\nTo fix:");
  console.error("1. Create a .env file in your project root");
  console.error("2. Add: GEMINI_API_KEY=your-api-key-here");
  console.error("3. Get API key from: https://aistudio.google.com/app/apikey");
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
console.log(`API Key found (length: ${apiKey.length} characters)`);
console.log(`   First 10 chars: ${apiKey.substring(0, 10)}...`);

// Check 2: Initialize Gemini
console.log("\nStep 2: Initializing Gemini...");
let genAI;
try {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log("✅ Gemini initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Gemini:", error.message);
  process.exit(1);
}

// Check 3: Test API call
console.log("\nStep 3: Testing API call...");
const testAPI = async () => {
  try {
    console.log("   Sending test request...");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Say 'Hello, I am working!' in exactly 5 words.";

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout after 10 seconds")), 10000),
      ),
    ]);

    const response = await result.response;
    const text = response.text();

    console.log("✅ API call successful!");
    console.log(`   Response: "${text}"`);
    console.log("\n✅ SUCCESS! Your Gemini API is working correctly!\n");

    console.log("Next steps:");
    console.log("1. Replace your controller files with the fixed versions");
    console.log("2. Restart your server");
    console.log("3. Test the AI features in your app");
  } catch (error) {
    console.error("❌ API call failed:", error.message);

    if (error.message.includes("API key")) {
      console.error("\nFix: Your API key is invalid");
      console.error(
        "   - Get a new key from: https://aistudio.google.com/app/apikey",
      );
      console.error("   - Update your .env file");
    } else if (error.message.includes("Timeout")) {
      console.error("\nFix: Request timed out");
      console.error("   - Check your internet connection");
      console.error("   - Try again in a few seconds");
    } else if (
      error.message.includes("quota") ||
      error.message.includes("limit")
    ) {
      console.error("\nFix: API quota exceeded");
      console.error("   - Free tier: 15 requests/minute");
      console.error("   - Wait a minute and try again");
      console.error("   - Or upgrade at: https://aistudio.google.com/");
    } else {
      console.error("\nPossible fixes:");
      console.error("   - Check your internet connection");
      console.error("   - Verify API key is correct");
      console.error("   - Check API status: https://status.cloud.google.com/");
    }

    process.exit(1);
  }
};

// Run the test
testAPI();
