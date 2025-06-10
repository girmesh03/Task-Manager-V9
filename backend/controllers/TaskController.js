import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import User from "../models/UserModel.js";
import Task from "../models/TaskModel.js";
import Department from "../models/DepartmentModel.js";
import AssignedTask from "../models/AssignedTaskModel.js";
import ProjectTask from "../models/ProjectTaskModel.js";
import Notification from "../models/NotificationModel.js";
import TaskActivity from "../models/TaskActivityModel.js";

import { getFormattedDate } from "../utils/GetDateIntervals.js";

// Authorization Helper
const authorizeTaskAccess = (user, task) => {
  const isCreator = task.createdBy.equals(user._id);
  const isAssigned =
    task.taskType === "AssignedTask" &&
    task.assignedTo.some((id) => id.equals(user._id));
  const isDepartmentManager =
    ["Manager", "Admin", "SuperAdmin"].includes(user.role) &&
    task.department.equals(user.department);
  const isSuperAdmin = user.role === "SuperAdmin";

  return isCreator || isAssigned || isDepartmentManager || isSuperAdmin;
};

// Helper function for array comparison
function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, index) => val === b[index]);
}

// @desc    Create Task (AssignedTask or ProjectTask)
// @route   POST /api/tasks/department/:departmentId
// @access  Private (SuperAdmin, Admin, Manager)
const createTask = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId } = req.params;
    const { taskType, ...taskData } = req.body;
    const creatorId = req.user._id;

    // Validate task type
    if (!["AssignedTask", "ProjectTask"].includes(taskType)) {
      throw new CustomError("Invalid task type", 400);
    }

    // Type-specific validations
    if (taskType === "AssignedTask") {
      if (!taskData.assignedTo?.length) {
        throw new CustomError("Assigned tasks require at least one user", 400);
      }

      // Validate assigned users belong to department
      const validUsers = await User.countDocuments({
        _id: { $in: taskData.assignedTo },
        department: departmentId,
      }).session(session);

      if (validUsers !== taskData.assignedTo.length) {
        throw new CustomError(
          "Some assigned users don't belong to the department",
          400
        );
      }
    }

    if (taskType === "ProjectTask") {
      if (!taskData.companyInfo?.name || !taskData.companyInfo?.phoneNumber) {
        throw new CustomError(
          "Company name and phone number are required for project tasks",
          400
        );
      }
      if (!taskData.proforma?.length) {
        throw new CustomError(
          "At least one proforma document is required for project tasks",
          400
        );
      }
    }

    // Create base task data
    const baseTask = {
      ...taskData,
      dueDate: getFormattedDate(new Date(taskData.dueDate), 0),
      department: departmentId,
      createdBy: creatorId,
    };

    // Create specific task type
    let newTask;
    if (taskType === "AssignedTask") {
      newTask = new AssignedTask(baseTask);
    } else {
      newTask = new ProjectTask(baseTask);
    }

    // Save task with validation
    // await newTask.validate({ session });
    await newTask.save({ session });

    // Create notifications
    const notifications = [];
    if (taskType === "AssignedTask") {
      notifications.push(
        ...newTask.assignedTo.map((userId) => ({
          user: userId,
          type: "TaskAssignment",
          message: `New task assigned: ${newTask.title}`,
          linkedDocument: newTask._id,
          linkedDocumentType: "Task",
          department: departmentId,
        }))
      );
    } else {
      // Notify department managers
      const managers = await User.find({
        department: departmentId,
        role: { $in: ["Manager", "Admin", "SuperAdmin"] },
      }).session(session);

      notifications.push(
        ...managers.map((user) => ({
          user: user._id,
          type: "SystemAlert",
          message: `New project task created: ${newTask.title}`,
          linkedDocument: newTask._id,
          linkedDocumentType: "Task",
          department: departmentId,
        }))
      );
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { session });
    }

    // Commit transaction
    await session.commitTransaction();

    //  Populate response data
    const populateOptions = [
      {
        path: "createdBy",
        select:
          "firstName lastName fullName email position role profilePicture",
      },
      { path: "department", select: "name" },
      {
        path: "activities",
        populate: {
          path: "performedBy",
          select:
            "firstName lastName fullName email position role profilePicture",
        },
      },
    ];

    if (taskType === "AssignedTask") {
      populateOptions.push({
        path: "assignedTo",
        select:
          "firstName lastName fullName email position role profilePicture",
      });
    }

    const populatedTask = await (taskType === "AssignedTask"
      ? AssignedTask
      : ProjectTask
    )
      .findById(newTask._id)
      .populate(populateOptions)
      .session(session)
      .lean({ virtuals: true });

    // Delete undefined fields
    Object.keys(populatedTask).forEach((key) => {
      if (populatedTask[key] === undefined) delete populatedTask[key];
    });

    res.status(201).json({
      success: true,
      task: {
        ...populatedTask,
        dueDate: new Date(populatedTask.dueDate).toISOString().split("T")[0],
      },
      message: `${taskType} created successfully`,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Get All Tasks (AssignedTask + ProjectTask)
// @route   GET /api/tasks/department/:departmentId
// @access  Private (SuperAdmin, Admin, Manager, User)
const getAllTasks = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { departmentId } = req.params;
    const user = req.user;
    const {
      page = 1,
      limit = 10,
      status,
      sort = "-createdAt",
      taskType,
    } = req.query;

    // Build base query, manager, admin their department task, super admin all
    // other than super admin, can't reach here due to department access middleware
    const query = { department: departmentId };

    // Apply task type filter
    if (taskType && ["AssignedTask", "ProjectTask"].includes(taskType)) {
      query.taskType = taskType;
    }

    // Apply user role filter
    if (user.role === "User") {
      query.assignedTo = { $in: [user._id] };
      query.taskType = "AssignedTask";
    }

    // Apply status filter
    if (status) query.status = status;

    // Configure pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        {
          path: "createdBy",
          select:
            "firstName lastName fullName email position role profilePicture",
          options: { session },
        },
        {
          path: "assignedTo",
          select:
            "firstName lastName fullName email position role profilePicture",
          options: { session },
        },
        {
          path: "department",
          select: "name description",
          options: { session },
        },
        {
          path: "activities",
          options: {
            session,
            // sort: { createdAt: -1 },
            // limit: 1,
            populate: {
              path: "performedBy",
              select:
                "firstName lastName fullName email position role profilePicture",
            },
          },
        },
      ],
      session,
    };

    // Execute paginated query
    const results = await Task.paginate(query, options);

    // Transform response
    const transformedTasks = results.docs.map((task) => ({
      ...task.toObject({ virtuals: true }),
      companyInfo:
        task.taskType === "ProjectTask" ? task.companyInfo : undefined,
      proforma: task.taskType === "ProjectTask" ? task.proforma : undefined,
      assignedTo:
        task.taskType === "AssignedTask" ? task.assignedTo : undefined,
    }));

    // Delete undefined fields
    for (const task of transformedTasks) {
      if (task.taskType === "ProjectTask") {
        delete task.assignedTo;
      } else {
        delete task.companyInfo;
        delete task.proforma;
      }
    }

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
      tasks: transformedTasks.map((task) => ({
        ...task,
        dueDate: new Date(task.dueDate).toISOString().split("T")[0],
      })),
      message: "Tasks retrieved successfully",
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Get Task by ID
// @route   GET /api/tasks/department/:departmentId/task/:taskId
// @access  Private (SuperAdmin, Admin, Manager, User)
const getTaskById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId, taskId } = req.params;
    const userId = req.user._id;

    // 1 to 3 additional checks on department access middleware
    // 1. Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // 2. Validate department existence
    const department = await Department.findById(departmentId).session(session);
    if (!department) throw new CustomError("Department not found", 404);

    // 3. Authorization check - Department access
    if (user.role !== "SuperAdmin" && !user.department.equals(departmentId)) {
      throw new CustomError(
        "Not authorized to access this department's tasks",
        403
      );
    }

    // 4. Get task with proper population
    const task = await Task.findById(taskId)
      .session(session)
      .populate([
        {
          path: "createdBy",
          select:
            "firstName lastName fullName email position role profilePicture",
          options: { session },
        },
        {
          path: "assignedTo",
          select:
            "firstName lastName fullName email position role profilePicture",
          options: { session },
        },
        {
          path: "department",
          select: "name description managers",
          options: { session },
        },
        {
          path: "activities",
          options: {
            session,
            // sort: { createdAt: -1 },
            populate: {
              path: "performedBy",
              select:
                "firstName lastName fullName email position role profilePicture",
              options: { session },
            },
          },
        },
      ]);

    if (!task) throw new CustomError("Task not found", 404);

    // 5. Validate task-department relationship
    if (!task.department.equals(departmentId) && user.role !== "SuperAdmin") {
      throw new CustomError(
        "Task does not belong to specified department",
        400
      );
    }

    // 6. Detailed authorization check
    if (!authorizeTaskAccess(user, task)) {
      throw new CustomError("Not authorized to view this task", 403);
    }

    // 7. Transform response based on task type
    const transformedTask = {
      ...task.toObject({ virtuals: true }),
      companyInfo: undefined,
      proforma: undefined,
      assignedTo: undefined,
    };

    if (task.taskType === "ProjectTask") {
      transformedTask.companyInfo = task.companyInfo;
      transformedTask.proforma = task.proforma;
    } else if (task.taskType === "AssignedTask") {
      transformedTask.assignedTo = task.assignedTo;
    }

    // 8. Add department manager information
    transformedTask.department.managers = await User.find({
      _id: { $in: task.department.managers },
    })
      .select("firstName lastName fullName position email role profilePicture")
      .session(session);

    await session.commitTransaction();

    // 9. Transform response
    if (transformedTask.taskType === "ProjectTask") {
      delete transformedTask.assignedTo;
    } else {
      delete transformedTask.companyInfo;
      delete transformedTask.proforma;
    }

    const { activities, ...rest } = transformedTask;

    res.status(200).json({
      success: true,
      task: {
        ...rest,
        dueDate: new Date(rest.dueDate).toISOString().split("T")[0],
      },
      activities: activities || [],
      message: "Task retrieved successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Update Task (Direct updates only, no activity/logging)
// @route   PUT /api/tasks/department/:departmentId/task/:taskId
// @access  Private (SuperAdmin, Admin, Manager) and creator
const updateTaskById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId, taskId } = req.params;
    const userId = req.user._id;
    const updateData = { ...req.body };

    // 1. Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // 2. Validate department existence
    const department = await Department.findById(departmentId).session(session);
    if (!department) throw new CustomError("Department not found", 404);

    // 3. Get the task without population
    const task = await Task.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // Capture original state before modifications
    const originalTaskState = task.toObject({ virtuals: true });
    const originalAssignedTo =
      originalTaskState.assignedTo?.map((id) => id.toString()) || [];

    // 4. Validate task-department relationship
    if (!task.department.equals(departmentId)) {
      throw new CustomError(
        "Task does not belong to specified department",
        400
      );
    }

    // 5. Authorization check
    const isCreator = task.createdBy.equals(userId);
    const isManagerPlus = ["SuperAdmin", "Admin", "Manager"].includes(
      user.role
    );
    const validDepartment = task.department.equals(user.department);

    if (!(isCreator || (isManagerPlus && validDepartment))) {
      throw new CustomError("Not authorized to update this task", 403);
    }

    // 6. Block User role updates
    if (user.role === "User")
      throw new CustomError("Users cannot update tasks", 403);

    // 7. Filter protected fields
    const protectedFields = ["taskType", "createdBy", "department", "status"];
    protectedFields.forEach((field) => delete updateData[field]);

    // 8. Validate allowed updates
    const allowedUpdates = [
      "title",
      "description",
      "location",
      "dueDate",
      "priority",
    ];
    if (task.taskType === "AssignedTask") allowedUpdates.push("assignedTo");
    if (task.taskType === "ProjectTask")
      allowedUpdates.push("companyInfo", "proforma");

    // 9. Apply updates and track changes
    let hasAssignedToChange = false;
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === "assignedTo") {
          // Track array changes by content
          const newAssignees = updateData[key].map((id) => id.toString());
          const oldAssignees = task[key].map((id) => id.toString());
          hasAssignedToChange = !arraysEqual(newAssignees, oldAssignees);
        }
        task[key] =
          key === "dueDate"
            ? getFormattedDate(new Date(updateData[key]), 0)
            : updateData[key];
      }
    });

    // 10. Validate assignedTo users
    if (task.taskType === "AssignedTask" && updateData.assignedTo) {
      const validUsers = await User.countDocuments({
        _id: { $in: updateData.assignedTo },
        department: departmentId,
      }).session(session);

      if (validUsers !== updateData.assignedTo.length) {
        throw new CustomError("Invalid users in assignedTo list", 400);
      }
    }

    // 11. Get changed fields using original state comparison
    const changedFields = [];
    Object.keys(updateData).forEach((key) => {
      if (
        allowedUpdates.includes(key) &&
        JSON.stringify(task[key]) !== JSON.stringify(originalTaskState[key])
      ) {
        changedFields.push(key);
      }
    });

    // Special handling for assignedTo array changes
    if (task.taskType === "AssignedTask") {
      const currentAssignedTo =
        task.assignedTo?.map((id) => id.toString()) || [];
      if (!arraysEqual(currentAssignedTo, originalAssignedTo)) {
        if (!changedFields.includes("assignedTo")) {
          changedFields.push("assignedTo");
        }
      }
    }

    // 12. Save changes
    await task.save({ session });

    // 13. Notification logic
    const notifications = [];
    const currentAssignedTo = task.assignedTo?.map((id) => id.toString()) || [];

    // Notification Scenario 1: New Assignees
    if (task.taskType === "AssignedTask" && hasAssignedToChange) {
      const newAssignees = currentAssignedTo.filter(
        (id) => !originalAssignedTo.includes(id)
      );

      if (newAssignees.length) {
        notifications.push(
          ...newAssignees.map((userId) => ({
            user: userId,
            type: "TaskAssignment",
            message: `Assigned to task: ${task.title}`,
            linkedDocument: task._id,
            linkedDocumentType: "Task",
            department: departmentId,
          }))
        );
      }
    }

    // Notification Scenario 2: Important Changes
    const importantFields = new Set([
      "title",
      "dueDate",
      "priority",
      "companyInfo",
      "proforma",
    ]);
    const hasImportantChange =
      changedFields.some((f) => importantFields.has(f)) || hasAssignedToChange;

    if (hasImportantChange) {
      // Notify creator
      if (!isCreator) {
        notifications.push({
          user: task.createdBy,
          type: "TaskUpdate",
          message: `Task updated: ${task.title}`,
          linkedDocument: task._id,
          linkedDocumentType: "Task",
          department: departmentId,
        });
      }

      // Notify existing assignees
      if (task.taskType === "AssignedTask") {
        originalAssignedTo.forEach((userId) => {
          if (userId !== user._id.toString()) {
            notifications.push({
              user: userId,
              type: "TaskUpdate",
              message: `Task modified: ${task.title}`,
              linkedDocument: task._id,
              linkedDocumentType: "Task",
              department: departmentId,
            });
          }
        });
      }

      // Notify project stakeholders
      if (task.taskType === "ProjectTask") {
        const leaders = await User.find({
          department: departmentId,
          role: { $in: ["Manager", "Admin", "SuperAdmin"] },
          _id: { $ne: userId },
        }).session(session);

        leaders.forEach((leader) => {
          notifications.push({
            user: leader._id,
            type: "SystemAlert",
            message: `Project task updated: ${task.title}`,
            linkedDocument: task._id,
            linkedDocumentType: "Task",
            department: departmentId,
          });
        });
      }
    }

    // Save notifications
    if (notifications.length) {
      await Notification.insertMany(notifications, { session });
    }

    // 14. Get updated task data
    const populatedTask = await Task.findById(taskId)
      .populate([
        {
          path: "createdBy",
          select:
            "firstName lastName fullName email position role profilePicture",
        },
        {
          path: "assignedTo",
          select:
            "firstName lastName fullName email position role profilePicture",
        },
        { path: "department", select: "name" },
        {
          path: "activities",
          options: { sort: { createdAt: -1 } },
          populate: {
            path: "performedBy",
            select:
              "firstName lastName fullName email position role profilePicture",
          },
        },
      ])
      .session(session)
      .lean({ virtuals: true });

    // 15. Clean response format
    if (populatedTask.taskType === "ProjectTask") {
      delete populatedTask.assignedTo;
    } else {
      delete populatedTask.companyInfo;
      delete populatedTask.proforma;
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      task: {
        ...populatedTask,
        dueDate: new Date(populatedTask.dueDate).toISOString().split("T")[0],
      },
      activities: populatedTask.activities || [],
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
// @access  Private (SuperAdmin, Admin, Manager) and creator
const deleteTaskById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId, taskId } = req.params;
    const userId = req.user._id;

    // 1. Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // 2. Validate department existence
    const department = await Department.findById(departmentId).session(session);
    if (!department) throw new CustomError("Department not found", 404);

    // 3. Get the task
    const task = await Task.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // 4. Validate task-department relationship
    if (!task.department.equals(departmentId)) {
      throw new CustomError(
        "Task does not belong to specified department",
        400
      );
    }

    // 5. Authorization check
    const isCreator = task.createdBy.equals(userId);
    const isAdminPlus = ["SuperAdmin", "Admin", "Manager"].includes(user.role);
    const sameDepartment = user.department.equals(departmentId);

    if (!((isCreator || isAdminPlus) && sameDepartment)) {
      throw new CustomError("Not authorized to delete this task", 403);
    }

    // 6. Delete task (middleware handles related deletions)
    await task.deleteOne({ session });

    // 7. Commit transaction
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Task and related data deleted successfully",
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

    // 1. Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // 2. Get and validate task
    const task = await Task.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // 3. Authorization check
    const isCreator = task.createdBy.equals(userId);
    const isAssigned =
      task.taskType === "AssignedTask" &&
      task.assignedTo.some((id) => id.equals(userId));

    if (!isCreator && !isAssigned) {
      throw new CustomError(
        "Not authorized to add activities to this task",
        403
      );
    }

    // 4. Create activity
    const activityData = {
      task: taskId,
      performedBy: userId,
      description,
      statusChange,
      attachments,
    };

    const activity = new TaskActivity(activityData);
    await activity.save({ session });

    // 5. Create notification for task creator
    if (!isCreator) {
      const notification = new Notification({
        user: task.createdBy,
        type: "TaskUpdate",
        message: `New activity added to task: ${task.title}`,
        linkedDocument: activity._id,
        linkedDocumentType: "TaskActivity",
        department: task.department,
      });
      await notification.save({ session });
    }

    await session.commitTransaction();

    // 7. Return populated activity
    const populatedActivity = await TaskActivity.findById(activity._id)
      .populate({
        path: "performedBy",
        select:
          "firstName lastName fullName email position role profilePicture",
      })
      .session(session);

    res.status(201).json({
      success: true,
      activity: populatedActivity,
      message: "Activity created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    console.log("here");
    session.endSession();
  }
});

// @desc    Get Task Activities
// @route   GET /api/tasks/:taskId/activities
// @access  Private (Assigned Users & Creator)
const getTaskActivities = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    // 1. Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // 2. Get and validate task
    const task = await Task.findById(taskId)
      .populate("department")
      .session(session);

    if (!task) throw new CustomError("Task not found", 404);

    // 3. Authorization check
    const isCreator = task.createdBy.equals(userId);
    const isAssigned =
      task.taskType === "AssignedTask" &&
      task.assignedTo.some((id) => id.equals(userId));
    const isDepartmentAdmin =
      ["SuperAdmin", "Admin", "Manager"].includes(user.role) &&
      user.department.equals(task.department._id);

    if (!isCreator && !isAssigned && !isDepartmentAdmin) {
      throw new CustomError("Not authorized to view these activities", 403);
    }

    // 4. Build query with proper population
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: {
        path: "performedBy",
        select: "firstName lastName fullName profilePicture",
        options: { session },
      },
      session,
    };

    // 5. Execute paginated query
    const results = await TaskActivity.paginate({ task: taskId }, options);

    // 6. Transform response
    const transformedActivities = results.docs.map((activity) => ({
      ...activity.toObject({ virtuals: true }),
      // attachments: activity.attachments?.map(att => ({
      //   ...att,
      //   url: generateSignedUrl(att.url) // Implement your URL signing logic
      // }))
      attachments: activity.attachments,
    }));

    await session.commitTransaction();

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
      activities: transformedActivities,
      message: "Activities retrieved successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
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

    // 1. Validate user existence and task
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    const task = await Task.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // 2. Validate activity existence and relationship
    const activity = await TaskActivity.findById(activityId)
      .session(session)
      .populate("task");

    if (!activity) throw new CustomError("Activity not found", 404);
    if (!activity.task._id.equals(taskId)) {
      throw new CustomError("Activity does not belong to this task", 400);
    }

    // 3. Authorization check
    const isCreator = activity.performedBy.equals(userId);
    const isAdminPlus = ["SuperAdmin", "Admin", "Manager"].includes(user.role);
    const sameDepartment = user.department.equals(activity.task.department);

    if (!(isCreator || (isAdminPlus && sameDepartment))) {
      throw new CustomError("Not authorized to delete this activity", 403);
    }

    // 4. Delete activity
    await activity.deleteOne({ session });

    // 5. Update task status if no activity left
    const activityCount = await TaskActivity.countDocuments({
      task: taskId,
    }).session(session);

    if (activityCount === 0) {
      task.status = "To Do";
      await task.save({ session });
    }

    // 6. Commit changes
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
