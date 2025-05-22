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

    // 2. Validate assigned users
    const assignedUsers = await User.find({ _id: { $in: assignedTo } }).session(
      session
    );
    if (assignedUsers.length !== assignedTo.length) {
      throw new CustomError("Invalid assigned users", 404);
    }

    // const invalidUsers = assignedUsers.filter(
    //   (u) => !u.department.equals(departmentId)
    // );
    // if (invalidUsers.length > 0) {
    //   throw new CustomError("Assigned users must belong to department", 400);
    // }

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

    const { page = 1, limit = 10, status, sort = "-createdAt" } = req.query;

    // 1. Build query
    const query = { department: departmentId };
    if (userRole === "User") query.assignedTo = { $in: [userId] };
    if (status) query.status = status;

    // 2. Execute paginated query
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        {
          path: "createdBy",
          select: "firstName lastName fullName email profilePicture",
        },
        {
          path: "assignedTo",
          select: "firstName lastName fullName email profilePicture",
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
    // const userId = req.user._id;
    const userRole = req.user.role;
    // const isSuperAdmin = req.user.role === "SuperAdmin";

    // 1. Validate department access
    // const user = await User.findById(userId);
    // if (!isSuperAdmin && !user.department.equals(departmentId)) {
    //   throw new CustomError("Department access denied", 403);
    // }

    // 2. Find task with full population
    const task = await Task.findOne({
      _id: taskId,
      department: departmentId,
    })
      .populate({
        path: "createdBy",
        select: "firstName lastName fullName email profilePicture",
      })
      .populate({
        path: "assignedTo",
        select: "firstName lastName fullName email profilePicture",
      })
      .populate({
        path: "department",
        select: "name description",
      })
      .populate({
        path: "activities",
        populate: {
          path: "performedBy",
          select: "firstName lastName fullName email profilePicture",
        },
        options: { sort: { createdAt: -1 } }, // Sort activities
      });

    if (!task) throw new CustomError("Task not found", 404);

    // 3. Authorization check for regular users
    if (userRole === "User") {
      const isAssigned = task.assignedTo.some((user) =>
        user._id.equals(req.user._id)
      );
      if (!isAssigned) throw new CustomError("Task access denied", 403);
    }

    res.status(200).json({
      success: true,
      task,
      activities: task.activities || [],
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
    const {
      title,
      description,
      location,
      dueDate,
      priority,
      assignedTo,
      status,
    } = req.body;

    // 1. Validate department access
    // Even super admin can't update tasks in other departments
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
      if (newAssignees.length > 0) {
        await TaskActivity.create(
          [
            {
              task: taskId,
              performedBy: userId,
              description: `Added ${newAssignees.length} new assignees`,
              // type: "AddAssignees",
              statusChange: {
                from: task.status,
                to: status || task.status,
              },
              // attachments: [],
            },
          ],
          { session }
        );
      }
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
      .populate({
        path: "createdBy",
        select: "firstName lastName fullName email profilePicture",
      })
      .populate({
        path: "assignedTo",
        select: "firstName lastName fullName email profilePicture",
      })
      .populate({
        path: "department",
        select: "name description",
      })
      .populate({
        path: "activities",
        populate: {
          path: "performedBy",
          select: "firstName lastName fullName email profilePicture",
        },
        options: { sort: { createdAt: -1 } }, // Sort activities
      });

    res.status(200).json({
      success: true,
      task: {
        ...response.toObject(),
        activities: task.activities || [], // Ensure array exists
      },
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

    if (!task.createdBy.equals(userId)) {
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
    const userRole = req.user.role;
    const { description, statusChange, attachments } = req.body;

    // 1. Validate permissions, task existence and permissions
    const user = await User.findById(userId);
    if (userRole !== "SuperAdmin" && !user.department.equals(userId)) {
      throw new CustomError("Department access denied", 403);
    }

    const task = await Task.findOne({ _id: taskId })
      .session(session)
      .populate("createdBy", "_id")
      .populate("assignedTo", "_id");

    if (!task) throw new CustomError("Task not found", 404);

    // 2. Verify user is creator or assigned
    const isCreator = task.createdBy._id.equals(userId);
    const isAssigned = task.assignedTo.some((u) => u._id.equals(userId));
    if (!isCreator && !isAssigned) {
      throw new CustomError("Not authorized to add activities", 403);
    }

    // 3. Create activity
    const [activity] = await TaskActivity.create(
      [
        {
          task: taskId,
          performedBy: userId,
          description,
          statusChange: statusChange
            ? {
                from: task.status,
                to: statusChange,
              }
            : undefined,
          attachments: attachments || [],
        },
      ],
      { session }
    );

    // 4. Auto-update task status through middleware
    await task.save({ session });

    // 5. Get notification recipients (creator + assigned - performer)
    const recipients = [
      task.createdBy._id,
      ...task.assignedTo.map((u) => u._id),
    ].filter((id) => !id.equals(userId));

    // Remove duplicates using Set
    const uniqueRecipients = [
      ...new Set(recipients.map((id) => id.toString())),
    ].map((id) => new mongoose.Types.ObjectId(id));

    // 6. Create notifications
    if (uniqueRecipients.length > 0) {
      const notifications = uniqueRecipients.map((userId) => ({
        user: userId,
        message: `New activity on task: ${task.title}`,
        type: "TaskActivity",
        task: taskId,
        linkedDocument: {
          _id: taskId,
          docType: "Task",
          department: task.department,
        },
      }));

      await Notification.insertMany(notifications, { session });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      activity,
      message: "Activity created with notifications",
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
    const userRole = req.user.role;

    // 1. Validate department access, task existence and permissions
    const user = await User.findById(userId);
    if (userRole !== "SuperAdmin" && !user.department.equals(userId)) {
      throw new CustomError("Department access denied", 403);
    }

    const task = await Task.findById(taskId)
      .populate("createdBy", "_id")
      .populate("assignedTo", "_id");

    if (!task) throw new CustomError("Task not found", 404);

    // 2. Verify access (SuperAdmin bypass)
    const isAllowed =
      userRole === "SuperAdmin" ||
      task.createdBy._id.equals(userId) ||
      task.assignedTo.some((u) => u._id.equals(userId));

    if (!isAllowed) throw new CustomError("Access denied", 403);

    // 3. Pagination configuration
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    // 4. Query activities with population
    const results = await TaskActivity.paginate(
      { task: taskId },
      {
        page,
        limit,
        sort: "-createdAt",
        populate: {
          path: "performedBy",
          select: "firstName lastName profilePicture",
          transform: (doc) => ({
            _id: doc._id,
            firstName: doc.firstName,
            lastName: doc.lastName,
            fullName: doc.fullName, // Requires virtual in User model
            profilePicture: doc.profilePicture,
          }),
        },
      }
    );

    res.status(200).json({
      success: true,
      pagination: {
        page: results.page,
        limit: results.limit,
        totalPages: results.totalPages,
        totalItems: results.totalDocs,
      },
      activities: results.docs,
      message: "Activities retrieved successfully",
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
    const { _id: userId, role: userRole } = req.user;

    // 1. Validate department access, activity existence with task relationship
    const user = await User.findById(userId);
    if (userRole !== "SuperAdmin" && !user.department.equals(userId)) {
      throw new CustomError("Department access denied", 403);
    }

    const activity = await TaskActivity.findById(activityId)
      .populate({
        path: "task",
        select: "department status activities dueDate",
        match: { _id: taskId },
      })
      .session(session);

    if (!activity?.task) throw new CustomError("Activity not found", 404);

    // 2. Prevent deletion for completed tasks
    if (activity.task.status === "Completed") {
      throw new CustomError(
        "Cannot delete activities for completed tasks",
        400
      );
    }

    // 3. Authorization checks
    const isCreator = activity.performedBy.equals(userId);
    const isPrivileged = ["SuperAdmin", "Admin", "Manager"].includes(userRole);

    if (!isCreator && !isPrivileged) {
      throw new CustomError("Delete permission denied", 403);
    }

    // 4. Department validation (skip for SuperAdmin)
    if (userRole !== "SuperAdmin") {
      const user = await User.findById(userId)
        .select("department")
        .session(session);

      if (!user.department.equals(activity.task.department)) {
        throw new CustomError("Cross-department operation denied", 403);
      }
    }

    // 5. Delete activity
    await activity.deleteOne({ session });

    // 6. Recalculate task status
    const task = await Task.findById(taskId)
      .session(session)
      .populate({
        path: "activities",
        match: { _id: { $ne: activityId } }, // Exclude deleted activity
      });

    const relevantActivities = task.activities.filter(
      (a) => a.statusChange?.to === task.status
    );

    if (relevantActivities.length === 0) {
      const now = new Date();
      task.status =
        task.dueDate <= now
          ? "Pending"
          : task.activities.length > 0
          ? "In Progress"
          : "To Do";
      await task.save({ session });
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
