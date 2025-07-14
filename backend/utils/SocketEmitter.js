import { getIO } from "./SocketInstance.js";
import User from "../models/UserModel.js";

export const emitToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(userId.toString()).emit(event, data);
    return true;
  } catch (err) {
    console.error(`Emit to user failed: ${err.message}`);
    return false;
  }
};

export const emitToManagers = async (departmentId, event, data) => {
  try {
    const io = getIO();
    const deptIdStr = departmentId.toString();
    io.to(`dept_managers_${deptIdStr}`).emit(event, data);
    return true;
  } catch (err) {
    console.error(`Emit to managers failed: ${err.message}`);
    return false;
  }
};

export const emitToDepartment = async (departmentId, event, data) => {
  try {
    const io = getIO();
    const deptIdStr = departmentId.toString();
    io.to(`department_${deptIdStr}`).emit(event, data);
    return true;
  } catch (err) {
    console.error(`Emit to department failed: ${err.message}`);
    return false;
  }
};

export const joinDepartmentRooms = async (userId) => {
  try {
    const io = getIO();
    const userIdStr = userId.toString();
    const sockets = await io.fetchSockets();
    const socket = sockets.find((s) => s.user?._id.toString() === userIdStr);

    if (!socket) {
      console.warn(`Socket not found for user: ${userIdStr}`);
      return;
    }

    const user = await User.findById(userIdStr).select("department role");
    if (!user?.department) return;

    socket.join(userIdStr);
    const deptIdStr = user.department.toString();

    socket.join(`department_${deptIdStr}`);

    if (["Manager", "Admin", "SuperAdmin"].includes(user.role)) {
      socket.join(`dept_managers_${deptIdStr}`);
    }
  } catch (error) {
    console.error("Socket room join error:", error.message);
  }
};
