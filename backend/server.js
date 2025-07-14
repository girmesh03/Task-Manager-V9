import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";
import { corsSocketOptions } from "./config/corsOptions.js";
import setupSocketIO from "./socket.js";
import { getIO } from "./utils/SocketInstance.js";
import { customDayjs } from "./utils/GetDateIntervals.js";

// Validate critical env vars
[
  "HOST",
  "PORT",
  "NODE_ENV",
  "TZ",
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
].forEach((varName) => {
  if (!process.env[varName])
    throw new Error(`Missing ${varName} environment variable`);
});

const PORT = parseInt(process.env.PORT || "5000");
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();

    // Initialize Socket.IO
    setupSocketIO(server, corsSocketOptions);

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📅 Server Time (UTC): ${new Date().toISOString()}`);
      console.log(
        `⏳ Server Time (Local - ${
          process.env.TZ || "System"
        }): ${customDayjs().format()}`
      );

      // Optional DB initialization
      if (process.env.INIT_SUPERADMIN === "true") {
        import("./mock/initializeDatabase.js")
          .then((module) => module.default())
          .then(() => console.log("SuperAdmin initialization completed"))
          .catch((err) =>
            console.error("SuperAdmin initialization failed:", err)
          );
      }
    });
  } catch (err) {
    console.error("🚨 Server startup failed:", err.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("🛑 Shutting down server...");

  try {
    // Close Socket.IO first
    if (getIO()) {
      getIO().close();
      console.log("Socket.IO server closed");
    }

    // Close HTTP server
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed");

    // Close MongoDB connection
    await mongoose.disconnect();
    console.log("MongoDB connection closed");

    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", (err) => {
  console.error("🛑 Uncaught Exception:", err.message);
  shutdown();
});
process.on("unhandledRejection", (reason) => {
  console.error("🛑 Unhandled Rejection:", reason);
});

startServer();

export { getIO as io };
