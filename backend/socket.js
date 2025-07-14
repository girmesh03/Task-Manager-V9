import jwt from "jsonwebtoken";
import User from "./models/UserModel.js";
import { Server as SocketIOServer } from "socket.io";
import { joinDepartmentRooms } from "./utils/SocketEmitter.js";
import { setIO } from "./utils/SocketInstance.js";
import CustomError from "./errorHandler/CustomError.js";

const extractToken = (cookieHeader) => {
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("access_token="));
  return tokenCookie ? tokenCookie.split("=")[1].trim() : null;
};

const socketAuth = async (socket, next) => {
  const token = extractToken(socket.handshake.headers.cookie);
  if (!token) return next(new CustomError("Authorization token required", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded._id).select(
      "+isVerified +isActive +tokenVersion"
    );

    if (!user) return next(new CustomError("User account not found", 404));
    if (!user.isVerified || !user.isActive)
      return next(new CustomError("Account not activated or suspended", 403));
    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(new CustomError("Session expired, please login again", 401));
    }

    // socket.user = {
    //   _id: user._id,
    //   role: user.role,
    //   department: user.department,
    //   tokenVersion: user.tokenVersion,
    // };

    socket.user = decoded;

    next();
  } catch (error) {
    next(new CustomError(`Authentication failed ${error.message}`, 401));
  }
};

const setupSocketIO = (server, corsSocketOptions) => {
  try {
    const io = new SocketIOServer(server, {
      path: "/api/socket.io",
      cors: corsSocketOptions,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
      },
    });

    setIO(io);
    io.use(socketAuth);

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id} | User: ${socket.user._id}`);

      // Non-blocking room join
      setTimeout(() => {
        joinDepartmentRooms(socket.user._id).catch((err) =>
          console.error(`Room join error: ${err.message}`)
        );
      }, 0);

      socket.on("disconnect", (reason) => {
        console.log(`Socket disconnected (${reason}): ${socket.id}`);
      });

      socket.on("error", (err) => {
        console.error(`Socket error: ${socket.id} | ${err.message}`);
      });
    });

    io.engine.on("connection_error", (err) => {
      console.error(`Socket.IO connection error: ${err.message}`);
    });

    return io;
  } catch (err) {
    console.error(`Socket.IO setup failed: ${err.message}`);
    throw err;
  }
};

export default setupSocketIO;
