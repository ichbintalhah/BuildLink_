const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = "AIzaSyDdDzZIXLExqSSOGcFnvnaR0Erabp8U1A8";

async function listModels() {
  console.log("Listing available Gemini models...");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
    );
    const data = await response.json();

    if (data.models) {
      console.log("\n✅ Available models:");
      data.models.forEach((model) => {
        console.log(`  - ${model.name}`);
      });
    } else {
      console.log("No models found or error:", data);
    }
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

async function testGemini() {
  console.log("\nTesting Gemini API with gemini-2.5-flash...");

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("Sending test prompt...");
    const result = await model.generateContent(
      "Say 'Hello, Gemini is working!' in one sentence.",
    );

    const response = result.response;
    const text = response.text();

    console.log("✅ SUCCESS! Gemini Response:", text);
    return true;
  } catch (error) {
    console.error("GEMINI API ERROR:");
    console.error("Error message:", error.message);
    return false;
  }
}

async function main() {
  await listModels();
  await testGemini();
}

main();
