import { io } from "../server.js";
import User from "../models/UserModel.js";

export const emitToUser = (userId, event, data) => {
  if (!io) return false;
  io.to(userId.toString()).emit(event, data);
  return true;
};

export const emitToManagers = async (departmentId, event, data) => {
  if (!io) return false;

  const managers = await User.find({
    department: departmentId,
    role: { $in: ["Manager", "Admin", "SuperAdmin"] },
  }).lean();

  managers.forEach((user) => {
    io.to(user._id.toString()).emit(event, data);
  });

  return true;
};

// Emit to all department members
export const emitToDepartment = async (departmentId, event, data) => {
  if (!io) {
    console.error("Socket.IO not initialized");
    return false;
  }

  const users = await User.find({ department: departmentId }).lean();
  users.forEach((user) => {
    io.to(user._id.toString()).emit(event, data);
  });

  return true;
};
