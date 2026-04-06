const jwt = require("jsonwebtoken");

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  // Send token in a secure HTTP-only cookie
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProduction,
    // Cross-domain frontend/backend requires SameSite=None in production.
    sameSite: isProduction ? "none" : "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

module.exports = generateToken;
