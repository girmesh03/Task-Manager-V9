import { io } from "../server.js";
import User from "../models/UserModel.js";
import CustomError from "../errorHandler/CustomError.js";

const getSocketRoom = (roomId) => `room:${roomId}`;

export const emitToUser = (userId, event, data) => {
  if (!io || !userId) return false;

  try {
    io.to(getSocketRoom(userId.toString())).emit(event, data);
    return true;
  } catch (error) {
    console.error(`Emit to user ${userId} failed:`, error);
    return false;
  }
};

export const emitToManagers = async (departmentId, event, data) => {
  if (!io) return false;

  try {
    const managerSockets = await User.aggregate([
      {
        $match: {
          department: departmentId,
          role: { $in: ["Manager", "Admin", "SuperAdmin"] },
        },
      },
      {
        $project: { socketRoom: { $concat: ["room:", { $toString: "$_id" }] } },
      },
    ]);

    managerSockets.forEach(({ socketRoom }) => {
      io.to(socketRoom).emit(event, data);
    });

    return true;
  } catch (error) {
    console.error("Emit to managers failed:", error);
    return false;
  }
};

export const emitToDepartment = (departmentId, event, data) => {
  if (!io) return false;

  try {
    io.to(getSocketRoom(`dept:${departmentId}`)).emit(event, data);
    return true;
  } catch (error) {
    console.error(`Emit to department ${departmentId} failed:`, error);
    return false;
  }
};
