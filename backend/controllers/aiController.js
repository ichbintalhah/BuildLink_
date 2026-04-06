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

  try {
    if (!query || !marlaSize) {
      return res
        .status(400)
        .json({ message: "Query and marlaSize are required" });
    }

    // Validate construction-only
    const nonConstructionKeywords = ["general", "chat", "how are you", "hello"];
    const queryLower = query.toLowerCase();
    const isGeneralChat = nonConstructionKeywords.some((keyword) =>
      queryLower.includes(keyword),
    );

    if (isGeneralChat && !queryLower.includes("construction")) {
      return res.status(400).json({
        message:
          "I can only help with construction-related queries. Please ask about building, renovation, or construction projects.",
      });
    }

    // Initialize Gemini
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

    const prompt = `
      You are an expert construction estimator specializing in Pakistani construction industry.
      
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
      
      ACCURACY RULES:
      1. Pakistani Marla has two standards: 225 sq ft (common in Punjab/urban areas) or 272 sq ft (older standard). If the user specifies, use that. Otherwise default to 225 sq ft. Total area = ${marlaSize} × (225 or 272) sq ft — use this in all calculations.
      2. Only provide construction-related estimates.
      3. Use ONLY the material prices provided above in the "Default Material Prices" section for cost calculations — do not assume or substitute your own rates. Multiply each material's unit price by the required quantity to get its cost.
      4. Derive material quantities using standard civil engineering ratios for the given scope area — do not inflate.
      5. Sum up individual material costs + labor to arrive at the total — the result must be consistent with the provided prices and calculated quantities.
      6. Calculate timeline by summing realistic phase durations for the specific scope; scale proportionally for small/partial work. --> like in general it take 90 days to build a 5 Marla Double story house with the team of 5 mens. and also show in response that this estimation is based on the team of 5 mens.
      7. Recheck your estimations on internet and Never over-estimate to "play it safe" — accuracy over padding.
      
      Provide response in JSON format:
      {
        "analysis": "Detailed explanation of the estimate with breakdown",
        "estimatedCost": <total cost in PKR as number>,
        "estimatedDays": <number of days>,
        "materials": {
          "material1": "quantity and unit",
          "material2": "quantity and unit"
        },
        "costBreakdown": {
          "materials": <cost in PKR>,
          "labor": <cost in PKR>,
          "contingency": <cost in PKR>
        }
      }
      
      Respond with ONLY the JSON, no markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    // Clean up markdown formatting
    let cleanText = responseText
      .replace(/```json|```/g, "")
      .replace(/[\n\r]/g, " ")
      .trim();

    // Find JSON in the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const aiEstimation = JSON.parse(jsonMatch[0]);

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
    console.error("AI Estimation Error:", error);
    res.status(500).json({
      message: "Failed to generate estimate. Please try a more specific query.",
      error: error.message,
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
