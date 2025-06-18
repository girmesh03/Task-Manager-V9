import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import User from "./models/UserModel.js";
import { Server as SocketIOServer } from "socket.io";
import CustomError from "./errorHandler/CustomError.js";

const getAccessToken = (cookieHeader) => {
  if (!cookieHeader) return null;
  return cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("access_token="))
    ?.split("=")[1]
    ?.trim();
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = getAccessToken(socket.handshake.headers.cookie);
    if (!token) throw new CustomError("Missing access token", 401, "AUTH-401");

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded._id).select(
      "+isActive +isVerified"
    );

    if (!user) throw new CustomError("User not found", 404, "USER-404");
    if (!user.isVerified || !user.isActive) {
      throw new CustomError("Account not active", 403, "ACCOUNT-403");
    }
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new CustomError("Token expired", 401, "AUTH-401");
    }

    socket.user = {
      _id: user._id,
      role: user.role,
      department: user.department,
    };

    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error("Authentication failed"));
  }
};

const setupSocketIO = (server, corsConfig) => {
  const io = new SocketIOServer(server, {
    cors: corsConfig,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    pingTimeout: 10000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user._id})`);

    // Join user-specific room
    socket.join(`room:${socket.user._id}`);

    // Join department room
    socket.join(`room:dept:${socket.user.department}`);

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });

    socket.on("error", (err) => {
      console.error(`Socket error (${socket.id}):`, err);
      socket.disconnect(true);
    });
  });

  return io;
};

export default setupSocketIO;
