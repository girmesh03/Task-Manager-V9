import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import corsOptions from "./config/corsOptions.js";
import globalErrorHandler from "./errorHandler/ErrorController.js";
import CustomError from "./errorHandler/CustomError.js";
import authLimiter from "./middlewares/rateLimiter.js";
import routes from "./routes/index.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// NoSQL‑injection sanitization
app.use(mongoSanitize());

// Response compression
app.use(compression());

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate Limiting for Auth Routes
app.use("/api/auth", authLimiter);

// API Routes
app.use("/api", routes);

// 404 Handler
app.all("*", (req, res, next) => {
  next(
    new CustomError(`Resource not found: ${req.originalUrl}`, 404, "ROUTE-404")
  );
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
