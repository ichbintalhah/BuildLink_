const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Contractor = require("../models/Contractor");

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Cookies (Best Practice)
  token = req.cookies.jwt;

  if (token) {
    try {
      // 2. Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Get User from Token (check both User and Contractor models)
      req.user = await User.findById(decoded.userId).select("-password");

      // If not found in User, check Contractor model
      if (!req.user) {
        req.user = await Contractor.findById(decoded.userId).select("-password");
      }

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// ✅ ADDED THIS FUNCTION
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};

module.exports = { protect, adminOnly };