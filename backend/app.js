// backend/app.js
import express from "express"; // The main Express framework
import cors from "cors"; // CORS middleware
import cookieParser from "cookie-parser"; // Cookie parsing middleware
import morgan from "morgan"; // HTTP request logging middleware
import helmet from "helmet"; // Security middleware for setting various HTTP headers
import compression from "compression"; // Response compression middleware
import mongoSanitize from "express-mongo-sanitize"; // Middleware to prevent MongoDB operator injection
import corsOptions from "./config/corsOptions.js"; // CORS configuration
import globalErrorHandler from "./errorHandler/ErrorController.js"; // Global error handler middleware
import CustomError from "./errorHandler/CustomError.js"; // Custom error class

// Routes
import routes from "./routes/index.js";

// --- Instantiate the Express Application ---
const app = express();

// --- Security Middleware Stack ---
// Helmet helps secure Express apps by setting various HTTP headers.
// Configuring directives for common resource types to enhance CSP.
app.use(helmet());

// Enable CORS with defined options for the API routes
app.use(cors(corsOptions));

// Parse cookies from the request headers
app.use(cookieParser());

// --- Body Parsing and Data Sanitization ---
// Parse JSON request bodies, with a limit to prevent large payload attacks
app.use(express.json({ limit: "100kb" }));
// Parse URL-encoded request bodies, extended: true allows complex object parsing
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Data Sanitization: Against NoSQL Query Injection and Cross-Site Scripting (XSS).
// Removes potential malicious characters like '$' and '.' from request body, query strings, and params.
app.use(mongoSanitize()); // Sanitize data against NoSQL query injection

// --- Response Compression ---
// Compress response bodies for all requests where applicable (e.g., JSON, HTML)
app.use(compression());

// --- Request Logging ---
// Use morgan for logging incoming requests. 'dev' is concise for development, 'combined' is standard Apache style.
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// --- API Routes ---
// Mount the main API routes router.
app.use("/api", routes);

// --- 404 Not Found Handler ---
// Catches any request that doesn't match any defined routes above.
// Must be placed *after* all specific route handlers.
app.all("*", (req, res, next) => {
  // Create a CustomError for unfound routes and pass it to the error handling middleware
  const errorMessage = `Resource not found. The requested URL ${req.originalUrl} was not found on this server.`;
  next(new CustomError(errorMessage, 404, "ROUTE_NOT_FOUND"));
});

// --- Global Error Handling Middleware ---
// Catches all errors passed with `next(err)` or thrown in previous middleware/route handlers.
// This must be the last middleware in the stack.
app.use(globalErrorHandler);

// Export the configured Express application instance
export default app;
