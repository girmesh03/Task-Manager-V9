import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import User from "./models/UserModel.js";

import { Server as SocketIOServer } from "socket.io";

const userSockets = new Map(); // Map userId to socketId

const setupSocketIO = (server, corsOptions) => {
  const io = new SocketIOServer(server, {
    cors: corsOptions,
  });

  // Middleware for Socket.IO authentication
  io.use(async (socket, next) => {
    const access_token = socket.handshake.headers.cookie.startsWith(
      "access_token="
    )
      ? socket.handshake.headers.cookie.split("access_token=")[1].split(";")[0]
      : null;

    if (!access_token) {
      console.error("Socket Auth Error: No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(access_token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded._id).select("+isVerified"); // Ensure isVerified is selected

      if (!user || !user.isVerified) {
        console.error(
          `Socket Auth Error: User ${decoded._id} not found or inactive`
        );
        return next(
          new Error("Authentication error: User not found or inactive")
        );
      }

      socket.user = user; // Attach user to the socket object
      next(); // Authentication successful
    } catch (err) {
      console.error("Socket Auth Error:", err.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // console.log(`User connected: ${socket.id}, UserID: ${socket.user._id}`);

    // Store the user's socket ID
    userSockets.set(socket.user._id.toString(), socket.id);

    // Join a room based on user ID (for direct messages/notifications)
    socket.join(socket.user._id.toString());

    // Example: Listen for a message from client (optional)
    socket.on("client_message", (data) => {
      console.log(`Message from client ${socket.user._id}:`, data);
      // You could broadcast this, store it, etc.
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });

    // Handle errors on the socket connection
    socket.on("error", (err) => {
      console.error(`Socket error:`, err);
      // Optionally disconnect the socket on critical errors
      socket.disconnect(true);
    });
  });

  return io; // Return the initialized io instance
};

export default setupSocketIO;
