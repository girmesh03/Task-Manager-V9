import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";
import app from "./app.js";

import connectDB from "./config/db.js";
import { corsSocketOptions } from "./config/corsOptions.js";
import setupSocketIO from "./socket.js";

import User from "./models/UserModel.js";
import initializeSuperAdmin from "./mock/initializeSuperAdmin.js";

// Get port from environment
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = setupSocketIO(server, corsSocketOptions);

// Connect to MongoDB
connectDB();

// Once connected, Listen on provided port, on all network interfaces
mongoose.connection.once("open", async () => {
  console.log("Connected to MongoDB");

  const superAdmin = await User.findOne({ role: "SuperAdmin" });
  if (!superAdmin) {
    console.log("Super Admin not found, initializing...");
    await initializeSuperAdmin();
  }

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Export the io instance for use in other modules
export { io };
