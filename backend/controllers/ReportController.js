import mongoose, { get } from "mongoose";
import dayjs from "dayjs";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import Task from "../models/TaskModel.js";
import RoutineTask from "../models/RoutineTaskModel.js";

import { getDateIntervals } from "../utils/GetDateIntervals.js";

// @desc    Get Task Report (Assigned or Project)
// @route   POST /api/reports/department/:departmentId/tasks
// @access  Private (SuperAdmin, Admin, Manager)
const getTaskReport = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const {
    page = 1,
    limit = 10,
    status = "",
    taskType,
    currentDate,
  } = req.query;

  // Validate page and limit
  const pageNum = Number(page);
  const limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    return next(
      new CustomError("Page number must be a positive integer.", 400)
    );
  }
  if (isNaN(limitNum) || limitNum < 1) {
    return next(new CustomError("Limit must be a positive integer.", 400));
  }

  // Get date intervals
  const dates = getDateIntervals(dayjs(currentDate).format("YYYY-MM-DD"));
  if (!dates) return next(new CustomError("Invalid date format", 400));

  const { last30DaysStart: startOfDay, last30DaysEnd: endOfDay } = dates;

  // Build base query
  const query = { department: new mongoose.Types.ObjectId(departmentId) };
  query.createdAt = { $gte: startOfDay, $lte: endOfDay };

  // Apply filters
  if (status) query.status = status;
  if (taskType) {
    if (!["AssignedTask", "ProjectTask"].includes(taskType)) {
      return next(
        new CustomError(
          "Invalid taskType. Must be 'AssignedTask' or 'ProjectTask'.",
          400
        )
      );
    }
    query.taskType = taskType;
  }

  const populateOptions = [
    { path: "department", select: "name" }, // Used for departmental context if needed, not directly for 'location' field here
    {
      path: "createdBy",
      select: "firstName lastName fullName email position role profilePicture",
    },
    {
      path: "assignedTo",
      select: "firstName lastName fullName email position role profilePicture",
    }, // For AssignedTask
    {
      path: "activities", // Virtual populate from TaskModel
      select: "description performedBy statusChange createdAt",
      populate: {
        path: "performedBy",
        select:
          "firstName lastName fullName email position role profilePicture",
      },
    },
  ];

  const options = {
    page: pageNum,
    limit: limitNum,
    sort: { createdAt: -1 },
    populate: populateOptions,
    // Note: Models have toJSON transforms. Avoid .lean() to ensure they are applied.
  };

  const result = await Task.paginate(query, options);

  const rows = result.docs.map((task) => {
    // task.toJSON() is implicitly called, so date fields are formatted as per model spec.
    const baseRow = {
      _id: task._id,
      id: task._id.toString(), // For MUI DataGrid
      date: task.createdAt, // Formatted by model's toJSON
      title: task.title,
      description: task.description,
      status: task.status,
      location: task.location, // Using TaskModel's own location field
      taskType: task.taskType,
      // Renaming to 'activities' as per PDF requirement for ProjectTask
      activities:
        task.activities && task.activities.length > 0
          ? task.activities
              .map((a) => {
                const userName = a.performedBy
                  ? `${a.performedBy.firstName} ${a.performedBy.lastName}`
                  : "System/Unknown";
                // Using a.description for activity comment as per TaskActivityModel
                return `${userName}: ${a.description}`;
              })
              .join("; ")
          : "N/A",
      // Optional: For additional context if needed by consumers
      // departmentName: task.department?.name || "N/A",
      // createdByFullName: task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : "N/A",
    };

    if (task.taskType === "AssignedTask") {
      return {
        ...baseRow,
        assignedUsers:
          task.assignedTo && task.assignedTo.length > 0
            ? task.assignedTo
                .map((u) =>
                  u ? `${u.firstName} ${u.lastName}` : "Unknown User"
                )
                .join("; ")
            : "N/A",
        // Nullify ProjectTask specific fields for clarity
        companyName: null,
        phoneNumber: null,
        projectActivities: null,
      };
    } else if (task.taskType === "ProjectTask") {
      return {
        ...baseRow,
        companyName: task.companyInfo?.name || "N/A",
        phoneNumber: task.companyInfo?.phoneNumber || "N/A",
        // Nullify AssignedTask specific fields for clarity
        assignedUsers: null,
      };
    }
    // Fallback for tasks that might not match expected types (shouldn't occur with query.taskType)
    return baseRow;
  });

  // Remove null values
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (row[key] === null) delete row[key];
    });
  });

  res.status(200).json({
    rows,
    page: result.page,
    pageSize: result.limit,
    rowCount: result.totalDocs,
  });
});

// @desc    Get Routine Task Report
// @route   POST /api/reports/department/:departmentId/routines
// @access  Private (SuperAdmin, Admin, Manager)
const getRoutineTaskReport = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const { page = 1, limit = 10, currentDate } = req.query;

  // Validate page and limit
  const pageNum = Number(page);
  const limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    return next(
      new CustomError("Page number must be a positive integer.", 400)
    );
  }
  if (isNaN(limitNum) || limitNum < 1) {
    return next(new CustomError("Limit must be a positive integer.", 400));
  }

  // Get date intervals
  const dates = getDateIntervals(dayjs(currentDate).format("YYYY-MM-DD"));
  if (!dates) return next(new CustomError("Invalid date format", 400));

  const { last30DaysStart: startOfDay, last30DaysEnd: endOfDay } = dates;

  // Build base query
  const query = { department: new mongoose.Types.ObjectId(departmentId) };
  query.createdAt = { $gte: startOfDay, $lte: endOfDay };

  const populateOptions = [
    { path: "department", select: "name" }, // For location (department's name)
    {
      path: "performedBy",
      select: "firstName lastName fullName email position role profilePicture",
    },
  ];

  const options = {
    page: pageNum,
    limit: limitNum,
    sort: { date: -1 }, // Sort by the routine's specific log date
    populate: populateOptions,
  };

  const result = await RoutineTask.paginate(query, options);

  const rows = result.docs.map((routine) => {
    // routine.date is formatted by model's toJSON
    const assignedUserStr = routine.performedBy
      ? `${routine.performedBy.firstName} ${routine.performedBy.lastName}`
      : "N/A";

    const routineDesc =
      routine.performedTasks && routine.performedTasks.length > 0
        ? routine.performedTasks.map((pt) => pt.description).join("; ")
        : "Routine Activities";

    const routineStatus =
      routine.performedTasks && routine.performedTasks.length > 0
        ? routine.performedTasks.every((pt) => pt.isCompleted)
          ? "Completed"
          : "Uncompleted"
        : "N/A";

    return {
      _id: routine._id,
      id: routine._id.toString(),
      date: routine.date, // RoutineTaskModel.date, formatted by its toJSON
      location: routine.department?.name || "N/A", // Department's name as location
      performedBy: assignedUserStr, // Matching example "performedBy" key
      description: routineDesc,
      status: routineStatus,
      taskType: "RoutineTask",
      // Optional: For additional context
      // departmentName: routine.department?.name || "N/A",
      // createdAt: routine.createdAt, // The record creation timestamp
    };
  });

  // Remove null values
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (row[key] === null) delete row[key];
    });
  });

  res.status(200).json({
    rows,
    page: result.page,
    pageSize: result.limit,
    rowCount: result.totalDocs,
  });
});

export { getTaskReport, getRoutineTaskReport };
