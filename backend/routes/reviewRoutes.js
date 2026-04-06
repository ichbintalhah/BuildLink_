const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addReview,
  getContractorReviews,
} = require("../controllers/reviewController");
const router = express.Router();

router.post("/", protect, addReview);
router.get("/:contractorId", getContractorReviews);

module.exports = router;
