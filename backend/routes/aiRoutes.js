const express = require("express");
const {
  getAIRecommendations,
  estimateConstructionCost,
  summarizeDispute,
} = require("../controllers/aiController");
const router = express.Router();

router.post("/recommend", getAIRecommendations);
router.post("/estimate", estimateConstructionCost);
router.post("/summarize", summarizeDispute);

module.exports = router;