import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req, res) => {
    // Allow more requests for admins
    return req.user?.role === "Admin" ? 500 : 100;
  },
  message: {
    success: false,
    message: "Too many requests, please try again later",
    errorCode: "RATE_LIMIT-429",
  },
  skip: (req) => {
    // Skip in development or for internal IPs
    return (
      process.env.NODE_ENV === "development" ||
      req.ip.startsWith("192.168.") ||
      req.ip === "::1"
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default authLimiter;
