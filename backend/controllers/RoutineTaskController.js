import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import RoutineTask from "../models/RoutineTaskModel.js";
import Notification from "../models/NotificationModel.js";
import User from "../models/UserModel.js";

import { getFormattedDate } from "../utils/GetDateIntervals.js";
import { emitToManagers } from "../utils/SocketEmitter.js";

// notifyDepartmentLeadership function
// const notifyDepartmentLeadership = async (
//   departmentId,
//   excludedUserId,
//   message,
//   taskId,
//   session
// ) => {
//   const managers = await User.find({
//     department: departmentId,
//     role: { $in: ["Manager", "Admin", "SuperAdmin"] },
//     _id: { $ne: excludedUserId },
//   });

//   const notification = {
//     type: "SystemAlert",
//     message,
//     linkedDocument: taskId,
//     linkedDocumentType: "RoutineTask",
//     department: departmentId,
//   };

//   managers.forEach(async (user) => {
//     const userNotification = { ...notification, user: user._id };
//     await Notification.create(userNotification, { session });
//     emitToUser(user._id, "new-notification", userNotification);
//   });
// };

// notifyDepartmentLeadership function
// const notifyDepartmentLeadership = async (
//   departmentId,
//   excludedUserId,
//   message,
//   taskId,
//   session
// ) => {
//   const leaders = await User.find({
//     department: departmentId,
//     role: { $in: ["Manager", "Admin", "SuperAdmin"] },
//     _id: { $ne: excludedUserId },
//   }).session(session);

//   if (leaders.length === 0) return;

//   const notifications = leaders.map((leader) => {
//     const notif = {
//       user: leader._id,
//       type: "SystemAlert",
//       message,
//       linkedDocument: taskId,
//       linkedDocumentType: "RoutineTask",
//       department: departmentId,
//     };

//     // Real-time emit
//     emitToUser(leader._id, "routine-update", notif);
//     return notif;
//   });

//   await Notification.insertMany(notifications, { session });
// };

// notifyDepartmentLeadership function
const notifyDepartmentLeadership = async (
  departmentId,
  excludedUserId,
  message,
  taskId,
  session
) => {
  const leaders = await User.find({
    department: departmentId,
    role: { $in: ["Manager", "Admin", "SuperAdmin"] },
    _id: { $ne: excludedUserId },
  }).session(session);

  if (leaders.length === 0) return;

  const notifications = leaders.map((leader) => ({
    user: leader._id,
    type: "SystemAlert",
    message,
    linkedDocument: taskId,
    linkedDocumentType: "RoutineTask",
    department: departmentId,
  }));

  // Save to database and emit real-time notifications
  await Notification.insertMany(notifications, { session });

  // Emit to all managers using optimized utility
  await emitToManagers(departmentId, "routine-update", {
    message,
    taskId,
    departmentId,
  });
};

// @desc    Create Routine Task
// @route   POST /api/routine-tasks/department/:departmentId
// @access  Private (User, Manager, Admin, SuperAdmin)
const createRoutineTask = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId } = req.params;
    const { date, performedTasks } = req.body;
    const userId = req.user._id;

    // Validate input data
    const taskDate = getFormattedDate(new Date(date), 0);
    if (taskDate > getFormattedDate(new Date(), 0)) {
      throw new CustomError("Cannot create future-dated tasks", 400);
    }

    if (!performedTasks?.length) {
      throw new CustomError("At least one task must be performed", 400);
    }

    // Create task
    const routineTask = new RoutineTask({
      department: departmentId,
      performedBy: userId,
      date: taskDate,
      performedTasks,
    });

    await routineTask.validate({ session });
    await routineTask.save({ session });

    // Notify leadership
    // await notifyDepartmentLeadership(
    //   departmentId,
    //   userId,
    //   `New routine task logged: ${taskDate}`,
    //   routineTask._id,
    //   session
    // );

    await notifyDepartmentLeadership(
      departmentId,
      userId,
      `New routine task logged: ${taskDate}`,
      routineTask._id,
      session
    );

    const populatedTask = await RoutineTask.findById(routineTask._id)
      .populate("department", "name")
      .populate(
        "performedBy",
        "firstName lastName fullName email position role profilePicture"
      )
      .session(session);

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      task: {
        ...populatedTask._doc,
        date: new Date(populatedTask.date).toISOString().split("T")[0],
      },
      message: "Routine task created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Get All Routine Tasks
// @route   GET /api/routine-tasks/department/:departmentId
// @access  Private (User, Manager, Admin, SuperAdmin)
const getAllRoutineTasks = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { departmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 },
      populate: [
        { path: "department", select: "name" },
        {
          path: "performedBy",
          select:
            "firstName lastName fullName email position role profilePicture",
        },
      ],
      session,
    };

    const results = await RoutineTask.paginate(
      { department: departmentId },
      options
    );

    res.status(200).json({
      success: true,
      pagination: {
        page: results.page,
        limit: results.limit,
        totalPages: results.totalPages,
        totalItems: results.totalDocs,
        hasNextPage: results.hasNextPage,
        hasPrevPage: results.hasPrevPage,
      },
      tasks: results.docs.map((task) => {
        return {
          ...task.toObject(),
          date: new Date(task.date).toISOString().split("T")[0],
        };
      }),
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Get Routine Task by ID
// @route   GET /api/routine-tasks/department/:departmentId/task/:taskId
// @access  Private (User, Manager, Admin, SuperAdmin)
const getRoutineTaskById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { departmentId, taskId } = req.params;

    // Find task with session-based query
    const task = await RoutineTask.findOne({
      _id: taskId,
      department: departmentId,
    })
      .populate("department", "name")
      .populate(
        "performedBy",
        "firstName lastName fullName email position role profilePicture"
      )
      .session(session);

    if (!task) {
      throw new CustomError("Routine task not found", 404);
    }

    // Return task data
    res.status(200).json({
      success: true,
      task: {
        ...task._doc,
        date: new Date(task.date).toISOString().split("T")[0],
      },
      message: "Routine task retrieved successfully",
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Update Routine Task
// @route   PUT /api/routine-tasks/department/:departmentId/task/:taskId
// @access  Private (Performer, Manager, Admin, SuperAdmin)
const updateRoutineTask = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const task = await RoutineTask.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // Authorization check
    const isPerformer = task.performedBy.equals(userId);
    const isManagerPlus = ["Manager", "Admin", "SuperAdmin"].includes(
      req.user.role
    );

    if (!isPerformer && !isManagerPlus) {
      throw new CustomError("Not authorized to update this task", 403);
    }

    // Prevent date modification for existing tasks
    if (updates.date) {
      const newDate = getFormattedDate(new Date(updates.date), 0);
      if (newDate !== getFormattedDate(task.date, 0)) {
        throw new CustomError("Task date cannot be modified", 400);
      }
    }

    // Validate performed tasks
    if (updates.performedTasks) {
      if (!Array.isArray(updates.performedTasks)) {
        throw new CustomError("Performed tasks must be an array", 400);
      }
      if (updates.performedTasks.length === 0) {
        throw new CustomError("At least one task must be performed", 400);
      }
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      if (["performedTasks"].includes(key)) {
        task[key] = updates[key];
      }
    });

    // await task.validate({ session });
    await task.save({ session });

    // Notify leadership
    // await notifyDepartmentLeadership(
    //   task.department,
    //   userId,
    //   `Routine task updated: ${getFormattedDate(task.date, 0)}`,
    //   task._id,
    //   session
    // );

    await notifyDepartmentLeadership(
      task.department,
      userId,
      `Routine task updated: ${getFormattedDate(task.date, 0)}`,
      task._id,
      session
    );

    const updatedTask = await RoutineTask.findById(taskId)
      .populate("department", "name")
      .populate(
        "performedBy",
        "firstName lastName fullName email position role profilePicture"
      )
      .session(session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      task: {
        ...updatedTask._doc,
        date: new Date(updatedTask.date).toISOString().split("T")[0],
      },
      message: "Routine task updated successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Delete Routine Task
// @route   DELETE /api/routine-tasks/department/:departmentId/task/:taskId
// @access  Private (Performer, Manager, Admin, SuperAdmin)
const deleteRoutineTask = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await RoutineTask.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // Authorization: Performer or Manager+
    const isPerformer = task.performedBy.equals(userId);
    const isManagerPlus = ["Manager", "Admin", "SuperAdmin"].includes(
      req.user.role
    );

    if (!isPerformer && !isManagerPlus) {
      throw new CustomError("Not authorized to delete this task", 403);
    }

    await task.deleteOne({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export {
  createRoutineTask,
  getAllRoutineTasks,
  getRoutineTaskById,
  updateRoutineTask,
  deleteRoutineTask,
};
