const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  bookAdvisoryVisit,
  getAllAdvisoryVisits,
  updateAdvisoryStatus,
} = require("../controllers/advisoryController");

const router = express.Router();

// Public route - anyone can book advisory
router.post("/", bookAdvisoryVisit);

// Admin routes - get all advisories and update status
router.get("/", getAllAdvisoryVisits);
router.put("/:id", updateAdvisoryStatus);

module.exports = router;
