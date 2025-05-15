import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable legacy headers
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  skip: (req) => process.env.NODE_ENV === "development", // Disable during development
});

export default authLimiter;
