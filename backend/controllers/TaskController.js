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
import { getDateIntervals, customDayjs } from "../utils/GetDateIntervals.js";
import { emitToUser, emitToManagers } from "../utils/SocketEmitter.js";

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
const PHONE_REGEX = /^(09\d{8}|\+2519\d{8})$/;

// @desc    Create Task (AssignedTask or ProjectTask)
// @route   POST /api/tasks/department/:departmentId
// @access  Private (SuperAdmin, Admin, Manager)
// const createTask = asyncHandler(async (req, res, next) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       title,
//       description,
//       location,
//       priority,
//       taskType,
//       clientInfo,
//       assignedTo,
//     } = req.body;
//     const { departmentId } = req.params;
//     const { company } = req.user;
//     const currentDate = new Date();

//     // 1. Validate required fields
//     const requiredFields = ["title", "dueDate", "taskType"];
//     const missingFields = requiredFields.filter((field) => !req.body[field]);

//     if (missingFields.length > 0) {
//       throw new CustomError(
//         `Missing required fields: ${missingFields.join(", ")}`,
//         400,
//         "VALIDATION_ERROR"
//       );
//     }

//     // 2. Validate task type
//     if (!["AssignedTask", "ProjectTask"].includes(taskType)) {
//       throw new CustomError("Invalid task type", 400, "VALIDATION_ERROR");
//     }

//     // 3. Validate dueDate (future date)
//     const dueDate = new Date(req.body.dueDate);
//     if (isNaN(dueDate.getTime())) {
//       throw new CustomError("Invalid due date format", 400, "VALIDATION_ERROR");
//     }

//     if (dueDate <= currentDate) {
//       throw new CustomError(
//         "Due date must be in the future",
//         400,
//         "VALIDATION_ERROR"
//       );
//     }

//     // 4. Validate department exists in company
//     const department = await Department.findOne({
//       _id: departmentId,
//       company,
//     }).session(session);

//     if (!department) {
//       throw new CustomError(
//         "Department not found in company",
//         404,
//         "RESOURCE_NOT_FOUND"
//       );
//     }

//     // 5. Validate creator user
//     const creator = await User.findOne({
//       _id: req.user._id,
//       company,
//       department: departmentId,
//       isActive: true,
//       role: { $in: ["SuperAdmin", "Admin", "Manager"] },
//     }).session(session);

//     if (!creator) {
//       throw new CustomError(
//         "Creator not authorized or active in department",
//         403,
//         "AUTHORIZATION_ERROR"
//       );
//     }

//     // 6. Task type specific validation
//     let taskData = {
//       title,
//       description,
//       location,
//       priority: priority || "Medium",
//       dueDate,
//       department: departmentId,
//       company,
//       createdBy: req.user._id,
//     };

//     if (taskType === "AssignedTask") {
//       // Validate assignedTo
//       if (
//         !assignedTo ||
//         !Array.isArray(assignedTo) ||
//         assignedTo.length === 0
//       ) {
//         throw new CustomError(
//           "At least one assigned user required",
//           400,
//           "VALIDATION_ERROR"
//         );
//       }

//       // Validate assigned users
//       const validUsers = await User.find({
//         _id: { $in: assignedTo },
//         company,
//         department: departmentId,
//         isActive: true,
//       }).session(session);

//       if (validUsers.length !== assignedTo.length) {
//         const invalidUsers = assignedTo.filter(
//           (id) => !validUsers.some((user) => user._id.equals(id))
//         );

//         throw new CustomError(
//           `Invalid or inactive users: ${invalidUsers.join(", ")}`,
//           403,
//           "AUTHORIZATION_ERROR"
//         );
//       }

//       taskData = { ...taskData, assignedTo };
//     } else if (taskType === "ProjectTask") {
//       // Validate clientInfo
//       if (!clientInfo?.name || !clientInfo?.phone) {
//         throw new CustomError(
//           "Company info name and phone required",
//           400,
//           "VALIDATION_ERROR"
//         );
//       }

//       if (!PHONE_REGEX.test(clientInfo.phone)) {
//         throw new CustomError(
//           "Invalid Ethiopian phone number format",
//           400,
//           "VALIDATION_ERROR"
//         );
//       }

//       taskData = { ...taskData, clientInfo };
//     }

//     // 7. Create task
//     let createdTask;
//     if (taskType === "AssignedTask") {
//       createdTask = new AssignedTask(taskData);
//     } else {
//       createdTask = new ProjectTask(taskData);
//     }

//     await createdTask.save({ session });

//     // 8. Create notifications and emit events
//     if (taskType === "AssignedTask") {
//       const notificationPromises = assignedTo.map((userId) =>
//         Notification.create(
//           [
//             {
//               user: userId,
//               message: `New task assigned: ${title}`,
//               type: "TaskAssignment",
//               department: departmentId,
//               company,
//               linkedDocument: createdTask._id,
//               linkedDocumentType: "Task",
//             },
//           ],
//           { session }
//         )
//       );

//       await Promise.all(notificationPromises);

//       // Emit socket events to assigned users
//       assignedTo.forEach((userId) => {
//         emitToUser(userId, "task_assignment", {
//           taskId: createdTask._id,
//           title,
//           dueDate: createdTask.dueDate,
//         });
//       });
//     } else {
//       const managers = await User.find({
//         department: departmentId,
//         role: { $in: ["Manager", "Admin", "SuperAdmin"] },
//         isActive: true,
//       }).session(session);

//       const notificationPromises = managers.map((manager) =>
//         Notification.create(
//           [
//             {
//               user: manager._id,
//               message: `New project task created: ${title}`,
//               type: "TaskAssignment",
//               department: departmentId,
//               company,
//               linkedDocument: createdTask._id,
//               linkedDocumentType: "Task",
//             },
//           ],
//           { session }
//         )
//       );

//       await Promise.all(notificationPromises);

//       // Emit socket event to department managers
//       emitToManagers(departmentId, "new_project_task", {
//         taskId: createdTask._id,
//         title,
//         department: departmentId,
//       });
//     }

//     // 9. Commit transaction
//     await session.commitTransaction();

//     // 10. Prepare response with populated fields
//     const responseTask = await DiscriminatorModel.findById(createdTask._id)
//       .populate({
//         path: "createdBy",
//         select: "firstName lastName role",
//       })
//       .populate({
//         path: "department",
//         select: "name",
//       });

//     res.status(201).json({
//       status: "success",
//       data: responseTask,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     next(error);
//   } finally {
//     session.endSession();
//   }
// });

// @desc    Create Task (AssignedTask or ProjectTask)
// @route   POST /api/tasks/department/:departmentId
// @access  Private (SuperAdmin, Admin, Manager)
const createTask = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      title,
      description,
      location,
      priority,
      taskType,
      clientInfo,
      assignedTo,
    } = req.body;
    const { departmentId } = req.params;
    const { company } = req.user;
    const currentDate = new Date();

    // Validate required fields
    if (!title || !req.body.dueDate || !taskType) {
      throw new CustomError(
        "Missing required fields: title, dueDate, or taskType",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Validate task type
    if (!["AssignedTask", "ProjectTask"].includes(taskType)) {
      throw new CustomError("Invalid task type", 400, "VALIDATION_ERROR");
    }

    // Validate dueDate
    const dueDate = new Date(req.body.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new CustomError("Invalid due date format", 400, "VALIDATION_ERROR");
    }

    if (dueDate <= currentDate) {
      throw new CustomError(
        "Due date must be in the future",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Validate department
    const department = await Department.findOne({
      _id: departmentId,
      company,
    }).session(session);

    if (!department) {
      throw new CustomError(
        "Department not found in company",
        404,
        "RESOURCE_NOT_FOUND"
      );
    }

    // Validate creator
    const creator = await User.findOne({
      _id: req.user._id,
      company,
      department: departmentId,
      isActive: true,
      role: { $in: ["SuperAdmin", "Manager"] },
    }).session(session);

    if (!creator) {
      throw new CustomError(
        "Creator not authorized or active in department",
        403,
        "AUTHORIZATION_ERROR"
      );
    }

    // Prepare task data
    const taskData = {
      title,
      description,
      location,
      priority: priority || "Medium",
      dueDate,
      department: departmentId,
      company,
      createdBy: req.user._id,
    };

    // Task type specific validation
    let task;
    if (taskType === "AssignedTask") {
      // Validate assignedTo
      if (!assignedTo?.length) {
        throw new CustomError(
          "At least one assigned user required",
          400,
          "VALIDATION_ERROR"
        );
      }

      // Validate assigned users
      const validUsers = await User.find({
        _id: { $in: assignedTo },
        company,
        department: departmentId,
        isActive: true,
      }).session(session);

      if (validUsers.length !== assignedTo.length) {
        const invalidUsers = assignedTo.filter(
          (id) => !validUsers.some((user) => user._id.equals(id))
        );

        throw new CustomError(
          `Invalid or inactive users: ${invalidUsers.join(", ")}`,
          403,
          "AUTHORIZATION_ERROR"
        );
      }

      // Create and save AssignedTask
      task = new AssignedTask({
        ...taskData,
        assignedTo,
      });

      await task.save({ session });
    } else {
      // ProjectTask validation
      if (!clientInfo?.name || !clientInfo?.phoneNumber) {
        throw new CustomError(
          "Company info name and phone required",
          400,
          "VALIDATION_ERROR"
        );
      }

      if (!PHONE_REGEX.test(clientInfo.phoneNumber)) {
        throw new CustomError(
          "Invalid Ethiopian phone number format",
          400,
          "VALIDATION_ERROR"
        );
      }

      // Create and save ProjectTask
      task = new ProjectTask({
        ...taskData,
        clientInfo,
      });

      await task.save({ session });
    }

    // Create notifications
    if (taskType === "AssignedTask") {
      const notifications = task.assignedTo.map((userId) => ({
        user: userId,
        message: `New task assigned: ${title}`,
        type: "TaskAssignment",
        department: departmentId,
        company,
        linkedDocument: task._id,
        linkedDocumentType: "Task",
      }));

      await Notification.insertMany(notifications, { session });

      // Emit socket events
      task.assignedTo.forEach((userId) => {
        emitToUser(userId, "new_assignment", {
          taskId: task._id,
          title,
          dueDate: task.dueDate,
        });
      });
    } else {
      const managers = await User.find({
        department: departmentId,
        role: { $in: ["Manager", "Admin", "SuperAdmin"] },
        isActive: true,
      }).session(session);

      const notifications = managers.map((manager) => ({
        user: manager._id,
        message: `New project task created: ${title}`,
        type: "TaskAssignment",
        department: departmentId,
        company,
        linkedDocument: task._id,
        linkedDocumentType: "Task",
      }));

      await Notification.insertMany(notifications, { session });

      // Emit to managers
      emitToManagers(departmentId, "new_project_task", {
        taskId: task._id,
        title,
        department: departmentId,
      });
    }

    await session.commitTransaction();

    // Populate response data
    const responseTask = await (taskType === "AssignedTask"
      ? AssignedTask
      : ProjectTask
    )
      .findById(task._id)
      .populate({
        path: "createdBy",
        select: "firstName lastName role",
      })
      .populate({
        path: "department",
        select: "name",
      })
      .populate({
        path: "assignedTo",
        select: "firstName lastName",
        match: { isActive: true }, // Only active users
      });

    res.status(201).json({
      status: "success",
      data: responseTask,
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
      currentDate,
    } = req.query;

    // Build base query
    const query = { department: departmentId };

    const dates = getDateIntervals(currentDate);
    if (!dates) throw new CustomError("Invalid date format", 400);
    const { last30DaysStart } = dates;
    query.createdAt = { $gte: last30DaysStart };

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
      clientInfo: task.taskType === "ProjectTask" ? task.clientInfo : undefined,
      assignedTo:
        task.taskType === "AssignedTask" ? task.assignedTo : undefined,
    }));

    // Delete undefined fields
    for (const task of transformedTasks) {
      if (task.taskType === "ProjectTask") {
        delete task.assignedTo;
      } else {
        delete task.clientInfo;
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
      tasks: transformedTasks,
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

  try {
    const { departmentId, taskId } = req.params;
    const userId = req.user._id;

    // Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // Validate department existence
    const department = await Department.findById(departmentId).session(session);
    if (!department) throw new CustomError("Department not found", 404);

    // Authorization check
    if (user.role !== "SuperAdmin" && !user.department.equals(departmentId)) {
      throw new CustomError(
        "Not authorized to access this department's tasks",
        403
      );
    }

    // Get task with proper population
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

    // Validate task-department relationship
    if (!task.department.equals(departmentId) && user.role !== "SuperAdmin") {
      throw new CustomError(
        "Task does not belong to specified department",
        400
      );
    }

    // Detailed authorization check
    if (!authorizeTaskAccess(user, task)) {
      throw new CustomError("Not authorized to view this task", 403);
    }

    // Transform response based on task type
    const transformedTask = {
      ...task.toObject({ virtuals: true }),
      clientInfo: undefined,
      assignedTo: undefined,
    };

    if (task.taskType === "ProjectTask") {
      transformedTask.clientInfo = task.clientInfo;
    } else if (task.taskType === "AssignedTask") {
      transformedTask.assignedTo = task.assignedTo;
    }

    // Add department manager information
    transformedTask.department.managers = await User.find({
      _id: { $in: task.department.managers },
    })
      .select("firstName lastName fullName position email role profilePicture")
      .session(session);

    // Clean response
    if (transformedTask.taskType === "ProjectTask") {
      delete transformedTask.assignedTo;
    } else {
      delete transformedTask.clientInfo;
    }

    const { activities, ...rest } = transformedTask;

    res.status(200).json({
      success: true,
      task: rest,
      activities: activities || [],
      message: "Task retrieved successfully",
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Update Task
// @route   PUT /api/tasks/department/:departmentId/task/:taskId
// @access  Private (SuperAdmin, Admin, Manager) and creator
const updateTaskById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { departmentId, taskId } = req.params;
    const userId = req.user._id;
    const updateData = { ...req.body };

    // Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // Validate department existence
    const department = await Department.findById(departmentId).session(session);
    if (!department) throw new CustomError("Department not found", 404);

    // Get the task
    const task = await Task.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // Capture original state
    const originalTaskState = task.toObject({ virtuals: true });
    const originalAssignedTo =
      originalTaskState.assignedTo?.map((id) => id.toString()) || [];

    // Validate task-department relationship
    if (!task.department.equals(departmentId)) {
      throw new CustomError(
        "Task does not belong to specified department",
        400
      );
    }

    // Authorization check
    const isCreator = task.createdBy.equals(userId);
    const isManagerPlus = ["SuperAdmin", "Admin", "Manager"].includes(
      user.role
    );
    const validDepartment = task.department.equals(user.department);

    if (!(isCreator || (isManagerPlus && validDepartment))) {
      throw new CustomError("Not authorized to update this task", 403);
    }

    // Block User role updates
    if (user.role === "User")
      throw new CustomError("Users cannot update tasks", 403);

    // Filter protected fields
    const protectedFields = ["taskType", "createdBy", "department", "status"];
    protectedFields.forEach((field) => delete updateData[field]);

    // Validate allowed updates
    const allowedUpdates = [
      "title",
      "description",
      "location",
      "dueDate",
      "priority",
    ];
    if (task.taskType === "AssignedTask") allowedUpdates.push("assignedTo");
    if (task.taskType === "ProjectTask") allowedUpdates.push("clientInfo");

    // Apply updates and track changes
    let hasAssignedToChange = false;
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === "assignedTo") {
          const newAssignees = updateData[key].map((id) => id.toString());
          const oldAssignees = task[key].map((id) => id.toString());
          hasAssignedToChange = !arraysEqual(newAssignees, oldAssignees);
        }
        task[key] =
          key === "dueDate"
            ? customDayjs(updateData[key]).toDate()
            : updateData[key];
      }
    });

    // Validate assignedTo users
    if (task.taskType === "AssignedTask" && updateData.assignedTo) {
      const validUsers = await User.countDocuments({
        _id: { $in: updateData.assignedTo },
        department: departmentId,
      }).session(session);

      if (validUsers !== updateData.assignedTo.length) {
        throw new CustomError("Invalid users in assignedTo list", 400);
      }
    }

    // Get changed fields
    const changedFields = [];
    Object.keys(updateData).forEach((key) => {
      if (
        allowedUpdates.includes(key) &&
        JSON.stringify(task[key]) !== JSON.stringify(originalTaskState[key])
      ) {
        changedFields.push(key);
      }
    });

    // Special handling for assignedTo
    if (task.taskType === "AssignedTask") {
      const currentAssignedTo =
        task.assignedTo?.map((id) => id.toString()) || [];
      if (!arraysEqual(currentAssignedTo, originalAssignedTo)) {
        if (!changedFields.includes("assignedTo")) {
          changedFields.push("assignedTo");
        }
      }
    }

    // Save changes
    await task.save({ session });

    // Notification logic
    const notifications = [];
    const currentAssignedTo = task.assignedTo?.map((id) => id.toString()) || [];

    // Notification for new assignees
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

    // Notification for important changes
    const importantFields = new Set([
      "title",
      "dueDate",
      "priority",
      "clientInfo",
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

    // Save notifications and emit events
    if (notifications.length) {
      await Notification.insertMany(notifications, { session });
      notifications.forEach((notif) => {
        emitToUser(notif.user, "notification-update", notif);
      });
    }

    // Get updated task data
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

    // Clean response format
    if (populatedTask.taskType === "ProjectTask") {
      delete populatedTask.assignedTo;
    } else {
      delete populatedTask.clientInfo;
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      task: populatedTask,
      activities: populatedTask.activities || [],
      message: "Task updated successfully",
    });
  } catch (error) {
    // Only abort if transaction is active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
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

  try {
    session.startTransaction();

    const { departmentId, taskId } = req.params;
    const userId = req.user._id;

    // Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // Validate department existence
    const department = await Department.findById(departmentId).session(session);
    if (!department) throw new CustomError("Department not found", 404);

    // Get the task
    const task = await Task.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // Validate task-department relationship
    if (!task.department.equals(departmentId)) {
      throw new CustomError(
        "Task does not belong to specified department",
        400
      );
    }

    // Authorization check
    const isCreator = task.createdBy.equals(userId);
    const isAdminPlus = ["SuperAdmin", "Admin", "Manager"].includes(user.role);
    const sameDepartment = user.department.equals(departmentId);

    if (!((isCreator || isAdminPlus) && sameDepartment)) {
      throw new CustomError("Not authorized to delete this task", 403);
    }

    // Delete task
    const notificationMessage = `Task "${task.title}" was deleted`;
    await emitToManagers(task.department, "task-deleted", {
      message: notificationMessage,
      taskId,
    });

    await task.deleteOne({ session });

    // Commit transaction
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Task and related data deleted successfully",
    });
  } catch (error) {
    // Only abort if transaction is active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
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

  try {
    session.startTransaction();

    const { taskId } = req.params;
    const userId = req.user._id;
    const { description, statusChange, attachments } = req.body;

    // Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // Get and validate task
    const task = await Task.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // Authorization check
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

    // Create activity
    const activityData = {
      task: taskId,
      performedBy: userId,
      description,
      statusChange,
      attachments,
    };

    const activity = new TaskActivity(activityData);
    const createdActivity = await activity.save({ session });

    if (!createdActivity) {
      throw new CustomError("Failed to create activity", 400);
    }

    // Create notification for task creator
    if (!isCreator) {
      const notification = new Notification({
        user: task.createdBy,
        task: task._id,
        type: "TaskUpdate",
        message: `New activity added to task: ${task.title}`,
        linkedDocument: activity._id,
        linkedDocumentType: "TaskActivity",
        department: task.department,
      });

      await notification.save({ session });
      emitToUser(task.createdBy, "new-activity", {
        ...notification.toObject(),
        taskTitle: task.title,
      });
    }

    await session.commitTransaction();

    // Return populated activity
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
    // Only abort if transaction is active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Get Task Activities
// @route   GET /api/tasks/:taskId/activities
// @access  Private (Assigned Users & Creator)
const getTaskActivities = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { taskId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    // Validate user existence
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // Get and validate task
    const task = await Task.findById(taskId)
      .populate("department")
      .session(session);

    if (!task) throw new CustomError("Task not found", 404);

    // Authorization check
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

    // Build query with proper population
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

    // Execute paginated query
    const results = await TaskActivity.paginate({ task: taskId }, options);

    // Transform response
    const transformedActivities = results.docs.map((activity) => ({
      ...activity.toObject({ virtuals: true }),
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
    // Only abort if transaction is active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
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

  try {
    session.startTransaction();

    const { taskId, activityId } = req.params;
    const userId = req.user._id;

    // Validate user existence and task
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    const task = await Task.findById(taskId).session(session);
    if (!task) throw new CustomError("Task not found", 404);

    // Validate activity existence and relationship
    const activity = await TaskActivity.findById(activityId)
      .session(session)
      .populate("task");

    if (!activity) throw new CustomError("Activity not found", 404);
    if (!activity.task._id.equals(taskId)) {
      throw new CustomError("Activity does not belong to this task", 400);
    }

    // Authorization check
    const isCreator = activity.performedBy.equals(userId);
    const isAdminPlus = ["SuperAdmin", "Admin", "Manager"].includes(user.role);
    const sameDepartment = user.department.equals(activity.task.department);

    if (!(isCreator || (isAdminPlus && sameDepartment))) {
      throw new CustomError("Not authorized to delete this activity", 403);
    }

    // Delete activity
    await activity.deleteOne({ session });

    // Update task status if no activity left
    const activityCount = await TaskActivity.countDocuments({
      task: taskId,
    }).session(session);

    if (activityCount === 0) {
      task.status = "To Do";
      await task.save({ session });
    }

    // Commit changes
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    // Only abort if transaction is active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
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
