import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import Task from "../models/TaskModel.js";
import Notification from "../models/NotificationModel.js";
import TaskActivity from "../models/TaskActivityModel.js";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

// @desc    Create Task
// @route   POST /api/tasks/department/:departmentId
// @access  Private (SuperAdmin, Admin, Manager)
const createTask = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId } = req.params;
    const { title, description, location, dueDate, priority, assignedTo } =
      req.body;
    const creatorId = req.user._id;

    // 1. Validate required fields
    if (!assignedTo?.length) {
      throw new CustomError("At least one user must be assigned", 400);
    }

    // 2. Validate creator and department
    const creator = await User.findById(creatorId).session(session);
    const department = await Department.findById(departmentId).session(session);

    if (!department) throw new CustomError("Department not found", 404);
    if (!creator?.department.equals(departmentId)) {
      throw new CustomError("Creator not in department", 400);
    }

    // 3. Validate assigned users
    const assignedUsers = await User.find({ _id: { $in: assignedTo } }).session(
      session
    );
    if (assignedUsers.length !== assignedTo.length) {
      throw new CustomError("Invalid assigned users", 404);
    }

    const invalidUsers = assignedUsers.filter(
      (u) => !u.department.equals(departmentId)
    );
    if (invalidUsers.length > 0) {
      throw new CustomError("Assigned users must belong to department", 400);
    }

    // 4. Create task
    const newTask = await Task.create(
      [
        {
          title,
          description,
          location,
          dueDate: getFormattedDate(dueDate, 0),
          priority,
          department: departmentId,
          createdBy: creatorId,
          assignedTo,
        },
      ],
      { session }
    );

    // 5. Create notifications
    const notifications = assignedTo.map((userId) => ({
      user: userId,
      message: `New task assigned: ${title}`,
      type: "TaskAssignment",
      task: newTask[0]._id,
      linkedDocument: {
        _id: newTask[0]._id,
        docType: "Task",
        department: departmentId,
      },
    }));
    await Notification.insertMany(notifications, { session });

    await session.commitTransaction();

    // 6. Populate response
    const populatedTask = await Task.findById(newTask[0]._id)
      .populate("createdBy", "firstName lastName fullName profilePicture")
      .populate("assignedTo", "firstName lastName fullName profilePicture")
      .populate("department", "name");

    res.status(201).json({
      success: true,
      task: populatedTask,
      message: "Task created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Get All Tasks
// @route   GET /api/tasks/department/:departmentId
// @access  Private (SuperAdmin, Admin, Manager, User)
const getAllTasks = asyncHandler(async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, sort = "-createdAt", status } = req.query;

    // 1. Validate department access
    const user = await User.findById(userId);
    if (!user.department.equals(departmentId)) {
      throw new CustomError("Department access denied", 403);
    }

    // 2. Build query
    const query = { department: departmentId };
    if (userRole === "User") query.assignedTo = { $in: [userId] };
    if (status) query.status = status;

    // 3. Execute paginated query
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        {
          path: "createdBy",
          select: "firstName lastName fullName profilePicture",
        },
        {
          path: "assignedTo",
          select: "firstName lastName fullName profilePicture",
        },
        { path: "department", select: "name" },
      ],
    };

    const results = await Task.paginate(query, options);

    res.status(200).json({
      success: true,
      pagination: {
        page: results.page,
        limit: results.limit,
        totalPages: results.totalPages,
        totalItems: results.totalDocs,
      },
      tasks: results.docs,
      message: "Tasks retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get Task
// @route   GET /api/tasks/department/:departmentId/task/:taskId
// @access  Private (SuperAdmin, Admin, Manager, User)
const getTaskById = asyncHandler(async (req, res, next) => {
  try {
    const { departmentId, taskId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. Validate department access
    const user = await User.findById(userId);
    if (!user.department.equals(departmentId)) {
      throw new CustomError("Department access denied", 403);
    }

    // 2. Fetch task
    const task = await Task.findOne({ _id: taskId, department: departmentId })
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("activities");

    if (!task) throw new CustomError("Task not found", 404);

    // 3. User access check
    if (
      userRole === "User" &&
      !task.assignedTo.some((u) => u._id.equals(userId))
    ) {
      throw new CustomError("Task access denied", 403);
    }

    res.status(200).json({
      success: true,
      task,
      message: "Task retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update Task
// @route   PUT /api/tasks/department/:departmentId/task/:taskId
// @access  Private (SuperAdmin, Admin, Manager)
const updateTaskById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId, taskId } = req.params;
    const userId = req.user._id;
    const { title, description, location, dueDate, priority, assignedTo } =
      req.body;

    // 1. Validate department access
    const user = await User.findById(userId).session(session);
    if (!user.department.equals(departmentId)) {
      throw new CustomError("Department access denied", 403);
    }

    // 2. Fetch and validate task
    const task = await Task.findOne({
      _id: taskId,
      department: departmentId,
    }).session(session);

    if (!task) throw new CustomError("Task not found", 404);

    // 3. Handle assignedTo changes
    let notifications = [];
    if (assignedTo) {
      // Validate new assignees
      const newUsers = await User.find({
        _id: { $in: assignedTo },
      }).session(session);
      const invalidUsers = newUsers.filter(
        (u) => !u.department.equals(departmentId)
      );
      if (invalidUsers.length > 0) {
        throw new CustomError("Invalid assigned users", 400);
      }

      // Find new assignees
      const newAssignees = assignedTo.filter(
        (id) => !task.assignedTo.some((existingId) => existingId.equals(id))
      );

      // Create notifications
      notifications = newAssignees.map((userId) => ({
        user: userId,
        message: `Assigned to task: ${task.title}`,
        type: "TaskAssignment",
        task: taskId,
        linkedDocument: {
          _id: taskId,
          docType: "Task",
          department: departmentId,
        },
      }));

      // Create activity
      await TaskActivity.create(
        [
          {
            task: taskId,
            performedBy: userId,
            description: `Added ${newAssignees.length} new assignees`,
          },
        ],
        { session }
      );
    }

    // 4. Save notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { session });
    }

    // 5. Apply updates
    task.title = title || task.title;
    task.description = description || task.description;
    task.location = location || task.location;
    task.dueDate = getFormattedDate(dueDate, 0) || task.dueDate;
    task.priority = priority || task.priority;
    task.assignedTo = assignedTo || task.assignedTo;

    const updatedTask = await task.save({ session });
    await session.commitTransaction();

    const response = await Task.findById(updatedTask._id)
      .populate("assignedTo", "firstName lastName fullName profilePicture")
      .populate("createdBy", "firstName lastName fullName profilePicture")
      .populate("department", "name");

    res.status(200).json({
      success: true,
      task: response,
      message: "Task updated successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Delete Task
// @route   DELETE /api/tasks/department/:departmentId/task/:taskId
// @access  Private (SuperAdmin, Admin, Manager)
const deleteTaskById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId, taskId } = req.params;
    const userId = req.user._id;

    // 1. Validate permissions
    const task = await Task.findOne({
      _id: taskId,
      department: departmentId,
    }).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    if (req.user.role === "Manager" && !task.createdBy.equals(userId)) {
      throw new CustomError("Delete permission denied", 403);
    }

    // 2. Delete task (triggers cascading deletes)
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

// @desc    Create Task Activity
// @route   POST /api/tasks/:taskId/activities
// @access  Private (Assigned Users & Creator)
const createTaskActivity = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.params;
    const userId = req.user._id;
    const { description, statusChange, attachments } = req.body;

    if (!attachments || !Array.isArray(attachments)) {
      throw new CustomError("Attachments must be an array", 400);
    }

    // 1. Validate task existence and permissions
    const task = await Task.findOne({ _id: taskId })
      .session(session)
      .populate("createdBy", "department")
      .populate("assignedTo", "department");

    if (!task) throw new CustomError("Task not found", 404);

    // 2. Verify user is creator or assigned
    const isCreator = task.createdBy._id.equals(userId);
    const isAssigned = task.assignedTo.some((u) => u._id.equals(userId));
    if (!isCreator && !isAssigned) {
      throw new CustomError("Not authorized to add activities", 403);
    }

    // 4. Create activity
    const activity = await TaskActivity.create(
      [
        {
          task: taskId,
          performedBy: userId,
          description,
          statusChange,
          attachments,
        },
      ],
      { session }
    );

    // 5. Auto-update task status through middleware
    const updatedTask = await Task.findById(taskId)
      .session(session)
      .populate("activities");

    // 6. Check dueDate expiration
    const now = getFormattedDate(new Date(), 0);
    if (updatedTask.dueDate <= now) {
      updatedTask.status = "Pending";
      await updatedTask.save({ session });
    }

    // 7. when a new activity is added, the creator should be notified if he is not the one who added the activity
    if (!isCreator) {
      const creator = updatedTask.createdBy;
      const notification = {
        user: creator._id,
        message: `New activity on task: ${updatedTask.title}`,
        type: "TaskActivity",
        task: taskId,
        linkedDocument: {
          _id: taskId,
          docType: "Task",
          department: updatedTask.department,
        },
      };

      await Notification.create([notification], { session });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      activity: activity[0],
      taskStatus: updatedTask.status,
      message: "Task activity created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Get Task Activities
// @route   GET /api/tasks/:taskId/activities
// @access  Private (Assigned Users & Creator)
const getTaskActivities = asyncHandler(async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    // 1. Validate task access
    const task = await Task.findOne({ _id: taskId })
      .populate("createdBy", "_id")
      .populate("assignedTo", "_id");

    if (!task) throw new CustomError("Task not found", 404);

    const isAllowed =
      task.createdBy._id.equals(userId) ||
      task.assignedTo.some((u) => u._id.equals(userId));

    if (!isAllowed) throw new CustomError("Access denied", 403);

    // 2. Get activities with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const options = {
      page,
      limit,
      sort: "-createdAt",
      populate: {
        path: "performedBy",
        select: "firstName lastName profilePicture",
      },
    };

    const activities = await TaskActivity.paginate({ task: taskId }, options);

    res.status(200).json({
      success: true,
      pagination: {
        page: activities.page,
        limit: activities.limit,
        totalPages: activities.totalPages,
        totalItems: activities.totalDocs,
      },
      activities: activities.docs,
      message: "Task activities retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete Task Activity
// @route   DELETE /api/tasks/:taskId/activities/:activityId
// @access  Private (Activity Creator, SuperAdmin, Admin, Manager)
const deleteTaskActivity = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId, activityId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. Validate activity existence and permissions
    const activity = await TaskActivity.findById(activityId)
      .populate("task")
      .session(session);

    if (!activity) throw new CustomError("Activity not found", 404);

    // 2. Verify user is creator or has privileges
    const isCreator = activity.performedBy.equals(userId);
    const isPrivileged = ["SuperAdmin", "Admin", "Manager"].includes(userRole);

    if (!isCreator && !isPrivileged) {
      throw new CustomError("Not authorized to delete this activity", 403);
    }

    // 3. Verify task department access
    const user = await User.findById(userId).session(session);
    if (!user.department.equals(activity.task.department)) {
      throw new CustomError("Cross-department operation not allowed", 403);
    }

    // 4. Delete the activity
    await activity.deleteOne({ session });

    // 5. Recalculate task status
    const task = await Task.findById(taskId)
      .session(session)
      .populate("activities");

    // If deleted activity was the last status change
    if (activity.statusChange) {
      const statusActivities = task.activities.filter(
        (a) => a.statusChange?.to === task.status
      );

      if (statusActivities.length === 0) {
        // Revert to previous status or default rules
        const now = new Date();

        if (task.dueDate <= now) {
          task.status = "Pending";
        } else {
          task.status = task.activities.length > 0 ? "In Progress" : "To Do";
        }

        await task.save({ session });
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export {
  createTask,
  getAllTasks,
  getTaskById,
  updateTaskById,
  deleteTaskById,
  createTaskActivity,
  getTaskActivities,
  deleteTaskActivity,
};
