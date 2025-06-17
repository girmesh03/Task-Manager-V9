import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// Import cors config
import corsOptions from "./config/corsOptions.js";

// Import error handler
import globalErrorHandler from "./errorHandler/ErrorController.js";
import CustomError from "./errorHandler/CustomError.js";

// Import routes
import AuthRoutes from "./routes/AuthRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";
import DepartmentRoutes from "./routes/DepartmentRoutes.js";
import TaskRoutes from "./routes/TaskRoutes.js";
import RoutineTaskRoutes from "./routes/RoutineTaskRoutes.js";
import StatisticsRoutes from "./routes/StatisticsRoutes.js";
import ReportRoutes from "./routes/ReportRoutes.js";
import AdminRoutes from "./routes/AdminRoutes.js";
import NotificationRoutes from "./routes/NotificationRoutes.js";

// Initialize app
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "30mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "30mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/departments", DepartmentRoutes);
app.use("/api/tasks", TaskRoutes);
app.use("/api/routine-tasks", RoutineTaskRoutes);
app.use("/api/statistics", StatisticsRoutes);
app.use("/api/reports", ReportRoutes);
app.use("/api/admin", AdminRoutes);
app.use("/api/notifications", NotificationRoutes);

// Error handling
app.all("*", (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    next(new CustomError(`Can't find ${req.originalUrl} on this server!`, 404));
  } else {
    next(new CustomError("Can't find the requested resource", 404));
  }
});

app.use(globalErrorHandler);

export default app;
