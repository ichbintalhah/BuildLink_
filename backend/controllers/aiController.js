const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/User");
const Contractor = require("../models/Contractor");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Analyze user issue and recommend contractors
// @route   POST /api/ai/recommend
const getAIRecommendations = async (req, res) => {
  const { query } = req.body;

  try {
    // 1. Fetch all contractors (Skills & Names)
    const contractors = await Contractor.find().select("fullName skill _id");

    // Create a mini-database string for AI to read
    const contractorList = contractors
      .map((c) => `${c.fullName} (Skill: ${c.skill}, ID: ${c._id})`)
      .join(", ");

    // 2. Ask Gemini (Updated Model: gemini-1.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Act as a construction expert. 
      User Problem: "${query}"
      
      Available Contractors: [${contractorList}]
      
      Task: 
      1. Identify the trade needed (e.g., Plumber, Electrician).
      2. Recommend up to 3 specific contractors from the list above who match that trade.
      3. Reply in strict JSON format:
      {
        "analysis": "Brief explanation of the problem",
        "recommendedSkill": "Plumber",
        "contractorIds": ["id1", "id2"] 
      }
      Do not include Markdown formatting like \`\`\`json. Just the raw JSON string.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response
      .text()
      .replace(/```json|```/g, "")
      .trim(); // Clean up formatting

    const aiData = JSON.parse(text);

    // 3. Fetch full details of the recommended contractors
    const recommendedProfiles = await Contractor.find({
      _id: { $in: aiData.contractorIds },
    }).select("-password");

    res.json({
      analysis: aiData.analysis,
      skill: aiData.recommendedSkill,
      contractors: recommendedProfiles,
    });
  } catch (error) {
    console.error("AI Error:", error);
    // If JSON parsing fails or AI fails, send a readable error
    res
      .status(500)
      .json({ message: "AI Service Unavailable", error: error.message });
  }
};

// @desc    Estimate construction costs, materials, and time
// @route   POST /api/ai/estimate
const estimateConstructionCost = async (req, res) => {
  const { query, marlaSize, materialPrices, projectContext } = req.body;
  const MAX_RETRIES = 1;

  try {
    // ===== INPUT VALIDATION =====
    if (!query || !marlaSize) {
      return res.status(400).json({
        success: false,
        message: "Query and marlaSize are required",
      });
    }

    // Improved validation: Allow realistic construction queries
    const constructionKeywords = [
      "build",
      "repair",
      "paint",
      "tile",
      "plumb",
      "electric",
      "roof",
      "wall",
      "door",
      "window",
      "floor",
      "ceiling",
      "foundation",
      "brick",
      "marble",
      "cement",
      "renovation",
      "construction",
      "cost",
      "estimate",
      "labor",
      "material",
      "install",
      "fix",
      "replace",
      "finishing",
      "exterior",
      "interior",
    ];

    const rejectKeywords = [
      "how are you",
      "hello",
      "hi there",
      "general chat",
      "tell me a joke",
      "what is the weather",
      "cook a recipe",
      "play a game",
    ];

    const queryLower = query.toLowerCase();
    const isRejectKeyword = rejectKeywords.some((keyword) =>
      queryLower.includes(keyword),
    );
    const isConstructionKeyword = constructionKeywords.some((keyword) =>
      queryLower.includes(keyword),
    );

    if (isRejectKeyword && !isConstructionKeyword) {
      return res.status(400).json({
        success: false,
        message:
          "I can only help with construction-related queries. Please ask about building, renovation, repairs, or construction projects.",
      });
    }

    // ===== SETUP GEMINI MODEL =====
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Pakistani market material prices
    const defaultPrices = {
      brick: 15,
      cementBag: 750,
      sand: 2500,
      steel: 350,
      paint: 800,
      tile: 150,
      labor: 500,
      marble: 500,
      gravel: 2000,
      rebar: 180,
    };

    const prices = materialPrices || defaultPrices;

    // ===== HELPER: Extract JSON safely =====
    const extractJSON = (text) => {
      if (!text) return null;

      // Strategy 1: Direct JSON parsing (fastest)
      try {
        const startIdx = text.indexOf("{");
        const endIdx = text.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1) {
          const jsonStr = text.substring(startIdx, endIdx + 1);
          return JSON.parse(jsonStr);
        }
      } catch (e) {
        // Continue to next strategy
      }

      // Strategy 2: Clean markdown and retry
      try {
        const cleaned = text
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        const startIdx = cleaned.indexOf("{");
        const endIdx = cleaned.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1) {
          const jsonStr = cleaned.substring(startIdx, endIdx + 1);
          return JSON.parse(jsonStr);
        }
      } catch (e) {
        // Continue to next strategy
      }

      return null;
    };

    // ===== HELPER: Generate AI estimate with retry =====
    const generateEstimate = async (attempt = 0) => {
      const prompt = `You are an expert construction estimator specializing in Pakistani construction industry.

Marla Size: ${marlaSize} sq ft
User Query: "${query}"
${projectContext ? `Previous Context: "${projectContext}"` : ""}

Material Prices (PKR):
- Brick: Rs. ${prices.brick} per piece
- Cement (50kg bag): Rs. ${prices.cementBag}
- Sand: Rs. ${prices.sand} per ton
- Steel: Rs. ${prices.steel} per kg
- Paint: Rs. ${prices.paint} per liter
- Tile: Rs. ${prices.tile} per sq ft
- Labor: Rs. ${prices.labor} per sq ft
- Marble: Rs. ${prices.marble} per sq ft
- Gravel: Rs. ${prices.gravel} per ton
- Rebar: Rs. ${prices.rebar} per kg

CRITICAL: RESPOND WITH ONLY VALID JSON. NO MARKDOWN. NO EXTRA TEXT.

ACCURACY RULES:
1. Pakistani Marla has two standards: 225 sq ft (common in Punjab/urban areas) or 272 sq ft (older standard). Use 225 sq ft as default. Total area = ${marlaSize} × 225 sq ft.
2. Only provide construction-related estimates.
3. Use ONLY the material prices provided above for all cost calculations.
4. Derive material quantities using standard civil engineering ratios.
5. Sum individual material costs + labor for the total.
6. Calculate timeline by summing realistic phase durations. Note: Typically 90 days to build a 5 Marla double-story house with a team of 5 workers.
7. Never over-estimate. Accuracy over padding.

RESPOND WITH THIS JSON STRUCTURE ONLY:
{
  "analysis": "Detailed explanation of the estimate with complete breakdown",
  "estimatedCost": <total cost in PKR as a number>,
  "estimatedDays": <number of days as a number>,
  "materials": {
    "material1": "quantity and unit",
    "material2": "quantity and unit"
  },
  "costBreakdown": {
    "materials": <cost in PKR as number>,
    "labor": <cost in PKR as number>,
    "contingency": <cost in PKR as number>
  }
}

START WITH { AND END WITH }. NO OTHER TEXT.`;

      try {
        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();

        console.log(
          `[AI Estimation - Attempt ${attempt + 1}] Raw Response Length: ${responseText.length}`,
        );

        const parsedJSON = extractJSON(responseText);

        if (parsedJSON) {
          return parsedJSON;
        }

        // If we have retries left, try again
        if (attempt < MAX_RETRIES) {
          console.warn(
            `[AI Estimation] Invalid JSON on attempt ${attempt + 1}. Retrying...`,
          );
          console.warn(`[AI Estimation] Raw response: ${responseText.substring(0, 500)}`);
          return generateEstimate(attempt + 1);
        }

        // All retries exhausted
        console.error(
          `[AI Estimation] Failed to extract valid JSON after ${MAX_RETRIES + 1} attempts`,
        );
        console.error(`[AI Estimation] Last response: ${responseText}`);
        throw new Error(
          "AI returned invalid JSON format even after retry. Unable to parse estimate.",
        );
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          console.warn(
            `[AI Estimation] Error on attempt ${attempt + 1}: ${error.message}. Retrying...`,
          );
          return generateEstimate(attempt + 1);
        }
        throw error;
      }
    };

    // ===== EXECUTE ESTIMATION =====
    const aiEstimation = await generateEstimate();

    // Validate response structure
    if (
      !aiEstimation.analysis ||
      !aiEstimation.estimatedCost ||
      !aiEstimation.estimatedDays ||
      !aiEstimation.materials ||
      !aiEstimation.costBreakdown
    ) {
      console.error("[AI Estimation] Invalid response structure:", aiEstimation);
      return res.status(500).json({
        success: false,
        message: "AI returned incomplete estimate data",
      });
    }

    // ===== RETURN SUCCESS =====
    res.json({
      success: true,
      analysis: aiEstimation.analysis,
      estimation: {
        estimatedCost: aiEstimation.estimatedCost,
        estimatedDays: aiEstimation.estimatedDays,
        materials: aiEstimation.materials,
        costBreakdown: aiEstimation.costBreakdown,
      },
    });
  } catch (error) {
    console.error("[AI Estimation] Fatal Error:", {
      message: error.message,
      stack: error.stack,
      query,
    });

    // Return safe error response - never crash
    res.status(500).json({
      success: false,
      message:
        "Failed to generate construction estimate. Please try a more specific query or contact support.",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Summarize and analyze disputes for admin
// @route   POST /api/ai/summarize
const summarizeDispute = async (req, res) => {
  const { prompt } = req.body;

  try {
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `
      You are a professional dispute resolution analyst. Analyze the following construction service dispute and respond in exactly the structure described below. Do not add any extra sections, symbols, dashes, asterisks, or hashtags anywhere in your response.

      ${prompt}

      Structure your response using exactly these four labeled sections. Write each section heading in all caps followed by a colon, then write the content on the next line. Follow the line limits size strictly.

      MAIN ISSUE:
      Write exactly 1 line describing the core problem of this dispute.

      SUMMARY:
      Write exactly 3 lines. Line 1 describes what happened. Line 2 covers what each party claims. Line 3 states the current status of the dispute.

      WHO APPEARS TO BE AT FAULT:
      Write exactly 2 lines. Line 1 names the party who appears more at fault. Line 2 gives the reason based on available facts and evidence.

      FINAL SUGGESTION FOR ADMIN:
      Write exactly 2 lines giving a clear and actionable decision recommendation for the admin to resolve this dispute fairly.

      Keep the tone professional, neutral, and fact-based. Do not use any special characters or formatting symbols.
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const summary = response.text();

    res.json({
      success: true,
      summary: summary,
      analysis: summary,
    });
  } catch (error) {
    console.error("AI Dispute Analysis Error:", error);
    res.status(500).json({
      message: "Failed to generate dispute analysis",
      error: error.message,
    });
  }
};

module.exports = {
  getAIRecommendations,
  estimateConstructionCost,
  summarizeDispute,
};
