const jwt = require("jsonwebtoken");

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  const frontendUrls = (process.env.FRONTEND_URLS || "")
    .split(",")
    .map((url) => url.trim().toLowerCase())
    .filter(Boolean);
  const hasRemoteFrontend = frontendUrls.some(
    (url) => !url.includes("localhost") && !url.includes("127.0.0.1"),
  );
  const useCrossSiteCookies =
    process.env.COOKIE_CROSS_SITE === "true" ||
    process.env.NODE_ENV === "production" ||
    hasRemoteFrontend;

  // Send token in a secure HTTP-only cookie
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: useCrossSiteCookies,
    // Cross-domain frontend/backend requires SameSite=None.
    sameSite: useCrossSiteCookies ? "none" : "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

module.exports = generateToken;
