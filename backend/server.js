import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";
import { corsSocketOptions } from "./config/corsOptions.js";
import setupSocketIO from "./socket.js";
import initializeDatabase from "./mock/initializeDatabase.js";

const PORT = parseInt(process.env.PORT || "5000");
const HOST = process.env.HOST || "0.0.0.0";

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = setupSocketIO(server, corsSocketOptions);
app.set("io", io);

// Connect to MongoDB
connectDB();

// Server startup handler
const startServer = async () => {
  try {
    await new Promise((resolve, reject) => {
      mongoose.connection.once("open", resolve);
      mongoose.connection.on("error", reject);
    });

    console.log("✅ MongoDB connected");

    // Initialize super admin in non-production environments
    if (process.env.NODE_ENV !== "production") {
      await initializeDatabase();
    }

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔻 Shutting down gracefully...");
  await mongoose.connection.close();
  server.close(() => {
    console.log("🔻 Server terminated");
    process.exit(0);
  });
});

export { io };
