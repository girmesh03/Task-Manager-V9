import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import User from "./models/UserModel.js";
import { Server as SocketIOServer } from "socket.io";

const getAccessToken = (cookieHeader) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";");
  const tokenCookie = cookies.find((c) => c.trim().startsWith("access_token="));
  return tokenCookie ? tokenCookie.split("=")[1].trim() : null;
};

const setupSocketIO = (server, corsSocketOptions) => {
  const io = new SocketIOServer(server, {
    cors: corsSocketOptions,
  });

  io.use(async (socket, next) => {
    const access_token = getAccessToken(socket.handshake.headers.cookie);
    if (!access_token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const decoded = jwt.verify(access_token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded._id).select("+isVerified");
      if (!user || !user.isVerified) {
        return next(
          new Error("Authentication error: User not found or inactive")
        );
      }
      socket.user = {
        _id: user._id,
        role: user.role,
        email: user.email,
        tokenVersion: user.tokenVersion,
        departmentId: user.department,
      };
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}, UserID: ${socket.user._id}`);

    // --- FIX: Join the user to a room named after their own ID ---
    // This is essential for the emitToUser function to work correctly.
    socket.join(socket.user._id.toString());

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });

    socket.on("error", (err) => {
      console.error(`Socket error on socket ${socket.id}:`, err);
      socket.disconnect(true);
    });
  });

  return io;
};

export default setupSocketIO;
