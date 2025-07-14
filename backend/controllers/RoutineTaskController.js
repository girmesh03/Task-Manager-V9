import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";
import RoutineTask from "../models/RoutineTaskModel.js";
import Notification from "../models/NotificationModel.js";
import CustomError from "../errorHandler/CustomError.js";
import { emitToManagers } from "../utils/SocketEmitter.js";
import {customDayjs} from "../utils/GetDateIntervals.js";

// Helper function to notify department leadership
const notifyDepartmentLeadership = async (
  departmentId,
  excludedUserId,
  message,
  taskId,
  session
) => {
  try {
    const leaders = await User.find({
      department: departmentId,
      role: { $in: ["Manager", "Admin", "SuperAdmin"] },
      _id: { $ne: excludedUserId },
      isActive: true,
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

    await Notification.insertMany(notifications, { session });
    await emitToManagers(departmentId, "routine-update", {
      message,
      taskId,
      departmentId,
    });
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};

// @desc    Create Routine Task
// @route   POST /api/routine-tasks/department/:departmentId
// @access  Private (User, Manager, Admin, SuperAdmin)
const createRoutineTask = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId } = req.params;
    const { date, performedTasks, attachments } = req.body;
    const userId = req.user._id;

    // Validate input
    if (
      !performedTasks ||
      !Array.isArray(performedTasks) ||
      performedTasks.length === 0
    ) {
      throw new CustomError("At least one task must be performed", 400);
    }

    // Validate date format and ensure it's not in future
    const taskDate = customDayjs(date);
    if (!taskDate.isValid()) {
      throw new CustomError("Invalid date format", 400);
    }
    if (taskDate.isAfter(customDayjs())) {
      throw new CustomError("Cannot create future-dated tasks", 400);
    }

    // Create task
    const routineTask = new RoutineTask({
      department: departmentId,
      date: taskDate.toDate(),
      performedBy: userId,
      performedTasks: performedTasks,
      attachments: attachments || [],
    });

    // Save task
    await routineTask.save({ session });

    // Notify leadership
    await notifyDepartmentLeadership(
      departmentId,
      userId,
      `New routine task logged: ${taskDate.format("MMM DD, YYYY")}`,
      routineTask._id,
      session
    );

    // Populate response data
    const populatedTask = await RoutineTask.findById(routineTask._id)
      .populate("department", "name")
      .populate({
        path: "performedBy",
        select: "firstName lastName fullName position email profilePicture",
        options: { virtuals: true },
      })
      .session(session);

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      task: populatedTask,
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
  const { departmentId } = req.params;
  const { page = 1, limit = 10, currentDate } = req.query;

  // Build query filter
  const filter = { department: departmentId };

  // Get date range and validate
  const start = customDayjs(currentDate).utc(true).subtract(29, "days");
  const end = customDayjs(currentDate).utc(true).endOf("day");

  if (!start.isValid() || !end.isValid()) {
    return next(new CustomError("Invalid date range", 400));
  }

  // Add date range filter
  filter.date = { $gte: start.toDate(), $lte: end.toDate() };

  // Pagination options
  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    sort: { date: -1, createdAt: -1 },
    populate: [
      { path: "department", select: "name" },
      {
        path: "performedBy",
        select: "firstName lastName fullName position email profilePicture",
      },
    ],
  };

  // Execute paginated query
  const results = await RoutineTask.paginate(filter, options);

  console.log("results", results.docs);

  res.status(200).json({
    success: true,
    pagination: {
      page: results.page,
      limit: results.limit,
      totalPages: results.totalPages,
      totalItems: results.totalDocs,
    },
    tasks: results.docs,
    message: "Routine tasks retrieved successfully",
  });
});

// @desc    Get Routine Task by ID
// @route   GET /api/routine-tasks/department/:departmentId/task/:taskId
// @access  Private (User, Manager, Admin, SuperAdmin)
const getRoutineTaskById = asyncHandler(async (req, res, next) => {
  const { departmentId, taskId } = req.params;

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return next(new CustomError("Invalid task ID", 400));
  }

  // Find task
  const task = await RoutineTask.findOne({
    _id: taskId,
    department: departmentId,
  })
    .populate("department", "name")
    .populate({
      path: "performedBy",
      select: "firstName lastName fullName position email profilePicture",
      options: { virtuals: true },
    });

  if (!task) {
    return next(new CustomError("Routine task not found", 404));
  }

  res.status(200).json({
    success: true,
    task,
    message: "Routine task retrieved successfully",
  });
});

// @desc    Update Routine Task
// @route   PUT /api/routine-tasks/department/:departmentId/task/:taskId
// @access  Private (Performer, Manager, Admin, SuperAdmin)
const updateRoutineTask = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.params;
    const { performedTasks } = req.body;
    const userId = req.user._id;

    // Validate input
    if (
      !performedTasks ||
      !Array.isArray(performedTasks) ||
      performedTasks.length === 0
    ) {
      throw new CustomError("At least one task must be performed", 400);
    }

    // Find task
    const task = await RoutineTask.findById(taskId).session(session);
    if (!task) {
      throw new CustomError("Task not found", 404);
    }

    // Authorization check
    const isPerformer = task.performedBy.equals(userId);
    const isManagerPlus = ["Manager", "Admin", "SuperAdmin"].includes(
      req.user.role
    );

    if (!isPerformer && !isManagerPlus) {
      throw new CustomError("Not authorized to update this task", 403);
    }

    // Update task details
    task.performedTasks = performedTasks;
    await task.save({ session });

    // Notify leadership
    const taskDate = customDayjs(task.date).format("MMMM D, YYYY");
    await notifyDepartmentLeadership(
      task.department,
      userId,
      `Routine task updated: ${taskDate}`,
      task._id,
      session
    );

    // Get updated task with populated data
    const updatedTask = await RoutineTask.findById(taskId)
      .populate("department", "name")
      .populate({
        path: "performedBy",
        select: "firstName lastName fullName position email profilePicture",
        options: { virtuals: true },
      })
      .session(session);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      task: updatedTask,
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

    // Find task
    const task = await RoutineTask.findById(taskId).session(session);
    if (!task) {
      throw new CustomError("Task not found", 404);
    }

    // Authorization check
    const isPerformer = task.performedBy.equals(userId);
    const isManagerPlus = ["Manager", "Admin", "SuperAdmin"].includes(
      req.user.role
    );

    if (!isPerformer && !isManagerPlus) {
      throw new CustomError("Not authorized to delete this task", 403);
    }

    // Delete task (triggers schema hooks)
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
