import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import RoutineTask from "../models/RoutineTaskModel.js";
import User from "../models/UserModel.js";
import Notification from "../models/NotificationModel.js";
import Department from "../models/DepartmentModel.js";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

// Helper: Create notifications for department leadership
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

  await Notification.insertMany(notifications, { session });
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

    // Validate department exists
    const department = await Department.findById(departmentId).session(session);
    if (!department) throw new CustomError("Department not found", 404);

    // Validate performer belongs to department
    const performer = await User.findById(userId).session(session);
    if (
      performer.role !== "SuperAdmin" &&
      !performer?.department.equals(departmentId)
    ) {
      throw new CustomError("Performer must belong to the department", 400);
    }

    // Validate date
    const taskDate = getFormattedDate(new Date(date), 0);
    if (taskDate > getFormattedDate(new Date(), 0)) {
      throw new CustomError("Cannot create tasks for future dates", 400);
    }

    // Validate performed tasks
    if (!performedTasks?.length) {
      throw new CustomError("At least one task must be performed", 400);
    }

    // Create task
    const routineTask = new RoutineTask({
      department: department._id,
      performedBy: performer._id,
      date: taskDate,
      performedTasks,
    });

    await routineTask.validate({ session });
    await routineTask.save({ session });

    // Create notifications for department leadership
    await notifyDepartmentLeadership(
      departmentId,
      performer._id,
      `New routine task created: ${routineTask.date}`,
      routineTask._id,
      session
    );

    const response = await RoutineTask.findById(routineTask._id)
      .session(session)
      .populate("department", "name")
      .populate("performedBy", "firstName lastName fullName profilePicture");

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      task: response,
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
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const userId = req.user._id;

    // Validate department exists
    const department = await Department.findById(departmentId).session(session);
    if (!department) throw new CustomError("Department not found", 404);

    // Authorization check
    const user = await User.findById(userId).session(session);
    if (user.role !== "SuperAdmin" && !user.department.equals(departmentId)) {
      throw new CustomError(
        "Not authorized to access this department's tasks",
        403
      );
    }

    // Build query
    const filter = { department: departmentId };

    // Apply filters
    filter.performedBy = userId;
    if (startDate && endDate) {
      filter.date = {
        $gte: getFormattedDate(new Date(startDate)),
        $lte: getFormattedDate(new Date(endDate)),
      };
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 },
      populate: [
        { path: "department", select: "name" },
        {
          path: "performedBy",
          select: "firstName lastName fullName profilePicture",
        },
      ],
      session,
    };

    const results = await RoutineTask.paginate(filter, options);

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
      tasks: results.docs,
      message: "Routine tasks retrieved successfully",
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
    const user = req.user;

    const task = await RoutineTask.findOne({
      _id: taskId,
      department: departmentId,
    })
      .populate("department", "name")
      .populate("performedBy", "firstName lastName fullName profilePicture")
      .session(session);

    if (!task) throw new CustomError("Routine task not found", 404);

    // Authorization check
    if (user.role !== "SuperAdmin" && !user.department.equals(departmentId)) {
      throw new CustomError("Not authorized to access this task", 403);
    }

    res.status(200).json({
      success: true,
      task,
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
    const { departmentId, taskId } = req.params;
    const updates = { ...req.body };
    const userId = req.user._id;

    // Get existing task
    const task = await RoutineTask.findOne({
      _id: taskId,
      department: departmentId,
    }).session(session);

    if (!task) throw new CustomError("Routine task not found", 404);

    // Authorization check
    const isPerformer = task.performedBy.equals(userId);
    const isManagerPlus =
      ["Manager", "Admin", "SuperAdmin"].includes(req.user.role) &&
      task.department.equals(req.user.departmentId);

    if (!isPerformer && !isManagerPlus) {
      throw new CustomError("Not authorized to update this task", 403);
    }

    // Prevent date modification for past tasks
    if (
      updates.date &&
      getFormattedDate(new Date(updates.date)) !== task.date
    ) {
      throw new CustomError("Cannot modify task date", 400);
    }

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (["performedTasks", "performedBy"].includes(key)) {
        task[key] = updates[key];
      }
    });

    await task.save({ session });

    // Create notifications for department leadership
    await notifyDepartmentLeadership(
      task.department,
      userId,
      `Routine task updated: ${task.date}`,
      task._id,
      session
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      task,
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
    const { departmentId, taskId } = req.params;
    const userId = req.user._id;

    const task = await RoutineTask.findOneAndDelete({
      _id: taskId,
      department: departmentId,
    }).session(session);

    if (!task) throw new CustomError("Routine task not found", 404);

    // Authorization check
    const isPerformer = task.performedBy.equals(userId);
    if (
      !["Manager", "Admin", "SuperAdmin"].includes(req.user.role) ||
      !task.department.equals(req.user.departmentId) ||
      !isPerformer
    ) {
      throw new CustomError("Not authorized to delete this task", 403);
    }

    // Create notifications for department leadership
    await notifyDepartmentLeadership(
      departmentId,
      userId,
      `Routine task deleted: ${task.date}`,
      task._id,
      session
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Routine task deleted successfully",
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
