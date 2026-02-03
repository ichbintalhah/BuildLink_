const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
    createDispute,
    getDisputeDetails,
    summarizeDisputeAI,
    resolveDispute,
    submitDefense,
    getMyDisputes // <--- IMPORT THIS
} = require("../controllers/disputeController");

// 1. Get List of Disputes (User/Contractor/Admin)
router.get("/", protect, getMyDisputes); // <--- ADDED THIS ROUTE

// 2. User files a dispute
router.post("/create", protect, createDispute);

// 3. Contractor submits defense
router.put("/:id/defense", protect, submitDefense);

// 4. Admin gets details
router.get("/:id", protect, adminOnly, getDisputeDetails);

// 5. Admin AI actions
router.post("/:id/summarize", protect, adminOnly, summarizeDisputeAI);
router.put("/:id/resolve", protect, adminOnly, resolveDispute);

module.exports = router;