// backend/socket.js

import dotenv from "dotenv";
dotenv.config();

import { Server as SocketIOServer } from "socket.io";

const userSockets = new Map(); // Map userId to socketId

const setupSocketIO = (server, corsOptions) => {
  const io = new SocketIOServer(server, {
    cors: corsOptions,
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
