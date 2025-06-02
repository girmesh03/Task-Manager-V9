import mongoose from "mongoose";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import dayjs from "dayjs";
import CustomError from "../errorHandler/CustomError.js";
import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import Task from "../models/TaskModel.js";
import RoutineTask from "../models/RoutineTaskModel.js";
import TaskActivity from "../models/TaskActivityModel.js";
import Notification from "../models/NotificationModel.js";

import { sendVerificationEmail } from "../utils/SendEmail.js";
import {
  getDateIntervals,
  getFormattedDate,
} from "../utils/GetDateIntervals.js";
import { getLeaderboardPipeline } from "../pipelines/Dashboard.js";
import {
  getUserTaskStatisticsForChartPipeline,
  getUserRoutineTaskStatisticsForChartPipeline,
} from "../pipelines/user.js";

// @desc    Create user
// @route   POST /api/users/department/:departmentId
// @access  Private (SuperAdmin, Admin)
const createUser = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId } = req.params;
    const { firstName, lastName, email, password, role, position } = req.body;
    const requester = req.user;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !position) {
      throw new CustomError("All fields are required", 400);
    }

    // Authorization check
    if (requester.role === "Admin" && role === "SuperAdmin") {
      throw new CustomError("Admins cannot create SuperAdmin users", 403);
    }

    // Check department existence
    const departmentExists = await Department.findById(departmentId).session(
      session
    );
    if (!departmentExists) {
      throw new CustomError("Department not found", 404);
    }

    // Generate verification token first
    const verificationToken = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();
    const verificationTokenExpiry = getFormattedDate(new Date(), 15);

    // Create user with token data
    const user = await User.create(
      [
        {
          firstName,
          lastName,
          email,
          password,
          role: role || "User",
          department: departmentId,
          position,
          verificationToken,
          verificationTokenExpiry,
        },
      ],
      { session }
    );

    const newUser = user[0];

    // SuperAdmin validation
    if (newUser.role === "SuperAdmin") {
      const existingSuperAdmin = await User.findOne({
        department: newUser.department,
        role: "SuperAdmin",
        _id: { $ne: newUser._id },
      }).session(session);

      if (existingSuperAdmin) {
        throw new CustomError(
          "Only one SuperAdmin allowed per department",
          400
        );
      }
    }

    // Send verification email
    await sendVerificationEmail(newUser.email, newUser.verificationToken);

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      user: newUser,
      message: "User created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Get all users
// @route   GET /api/users/department/:departmentId
// @access  Private (SuperAdmin: any, Other: department)
const getAllUsers = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const { page = 1, limit = 10, role } = req.query;
  const requester = req.user;
  const filter = { isActive: true };

  // Validate department
  const department = await Department.findById(departmentId);
  if (!department) {
    return next(new CustomError("Department not found", 404));
  }

  // Apply filters
  filter.department = departmentId; // Initially the requested departmentId
  if (role) filter.role = role;

  // Department filter for non-superadmins
  if (requester.role !== "SuperAdmin") {
    filter.department = requester.departmentId;

    if (requester.role === "Manager") {
      filter.role = { $nin: ["SuperAdmin", "Admin"] };
    }
  }

  // Pagination and sorting
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: "department", select: "name" },
      { path: "managedDepartment", select: "name" },
    ],
    sort: "-createdAt",
  };

  const result = await User.paginate(filter, options);

  res.status(200).json({
    success: true,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.totalDocs,
      totalPages: result.totalPages,
    },
    users: result.docs,
    message: "Users retrieved successfully",
  });
});

// @desc    Get user
// @route   GET /api/users/department/:departmentId/user/:userId
// @access  Private (SuperAdmin: any, Other: department)
const getUserById = asyncHandler(async (req, res, next) => {
  const { departmentId, userId } = req.params;
  const { currentDate = new Date().toISOString().split("T")[0] } = req.query;

  // Get date intervals
  const dates = getDateIntervals(currentDate);
  if (!dates) return next(new CustomError("Invalid date format", 400));

  const { last30DaysStart, last30DaysEnd: today } = dates;

  try {
    const user = await User.findOne({
      _id: userId,
      department: departmentId,
    })
      .populate([
        {
          path: "department",
          select: "name",
          populate: {
            path: "managers",
            select: "firstName lastName fullName email position profilePicture",
          },
        },
      ])
      .select("firstName lastName email position fullName profilePicture");

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Stat
    const stats = await User.aggregate(
      getLeaderboardPipeline({
        currentStartDate: last30DaysStart,
        currentEndDate: today,
        departmentId: user.department._id,
        userId: user._id,
      })
    );

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject({ virtuals: true }),
        assignedTaskCount: stats[0]?.assignedTaskCount || 0,
        routineTaskCount: stats[0]?.routineTaskCount || 0,
        totalCompleted: stats[0]?.totalCompleted || 0,
        rating: stats[0]?.rating || 0,
      },
      message: "User retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user
// @route   PUT /api/users/department/:departmentId/user/:userId
// @access  Private (SuperAdmin, Admin)
const updateUserById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId, userId } = req.params;
    const updates = req.body;
    const requester = req.user;

    const user = await User.findOne({
      _id: userId,
      department: departmentId,
    }).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // Authorization checks
    if (requester.role === "Admin") {
      if (user.role === "SuperAdmin" || updates.role === "SuperAdmin") {
        throw new CustomError("Admins cannot modify SuperAdmin users", 403);
      }
      if (!user.department.equals(requester.departmentId)) {
        throw new CustomError("Cannot update users in other departments", 403);
      }
    }

    // Prevent email changes through this endpoint
    if (updates.email) {
      throw new CustomError("Email cannot be changed", 400);
    }

    // Handle role changes
    if (updates.role === "SuperAdmin") {
      const existingSuperAdmin = await User.findOne({
        department: user.department,
        role: "SuperAdmin",
      }).session(session);

      if (existingSuperAdmin && !existingSuperAdmin._id.equals(userId)) {
        throw new CustomError(
          "Only one SuperAdmin allowed per department",
          400
        );
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      session,
    });

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      user: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Delete user
// @route   DELETE /api/users/department/:departmentId/user/:userId
// @access  Private (SuperAdmin)
const deleteUserById = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { departmentId, userId } = req.params;
    const requester = req.user;

    const user = await User.findOne({ _id: userId, department: departmentId })
      .session(session)
      .populate("department");
    if (!user) throw new CustomError("User not found", 404);

    // Authorization check - Only SuperAdmin can perform permanent deletion
    if (requester.role !== "SuperAdmin") {
      throw new CustomError(
        "Only SuperAdmin can delete users permanently",
        403
      );
    }

    // Prevent deletion of protected roles
    if (["SuperAdmin", "Admin", "Manager"].includes(user.role)) {
      // Check for active dependencies
      const taskCount = await Task.countDocuments({
        createdBy: userId,
      }).session(session);
      const managedDepartments = await Department.countDocuments({
        managers: userId,
      }).session(session);

      if (taskCount > 0 || managedDepartments > 0) {
        throw new CustomError(
          `Cannot delete ${user.role} with active dependencies (tasks or managed departments)`,
          400
        );
      }
    }

    // Special handling for SuperAdmin
    if (user.role === "SuperAdmin") {
      const otherSuperAdmins = await User.countDocuments({
        department: user.department,
        role: "SuperAdmin",
        _id: { $ne: userId },
      }).session(session);

      if (otherSuperAdmins === 0) {
        throw new CustomError(
          "Cannot delete last SuperAdmin in department. Promote another user first.",
          400
        );
      }
    }

    // Delete all user-related data in atomic operations
    await Promise.all([
      // Remove from department managers
      Department.updateMany(
        { managers: userId },
        { $pull: { managers: userId } },
        { session }
      ),

      // Delete tasks created by user and their dependencies
      Task.deleteMany({ createdBy: userId }).session(session),

      // Remove from task assignments
      Task.updateMany(
        { assignedTo: userId },
        { $pull: { assignedTo: userId } },
        { session }
      ),

      // Delete task activities
      TaskActivity.deleteMany({ performedBy: userId }).session(session),

      // Delete notifications
      Notification.deleteMany({
        $or: [{ user: userId }, { "linkedDocument.user": userId }],
      }).session(session),
    ]);

    // Permanent deletion
    await User.deleteOne({ _id: userId }).session(session);

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "User and all associated data deleted permanently",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @desc    Get user profile
// @route   GET /api/users/department/:departmentId/user/:userId/profile
// @access  Private (SuperAdmin, Admin, Manager, User)
const getUserProfileById = asyncHandler(async (req, res, next) => {
  const { departmentId, userId } = req.params;
  const { currentDate = dayjs().format("YYYY-MM-DD") } = req.query;

  // Get user
  const user = await User.findOne({ _id: userId, department: departmentId })
    .populate("department", "name")
    .select("firstName lastName email position fullName profilePicture");
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Get date intervals
  const dates = getDateIntervals(currentDate);
  if (!dates) return next(new CustomError("Invalid date format", 400));

  const {
    last30DaysStart,
    last30DaysEnd: today,
    daysInLast30,
    dateRange,
  } = dates;

  try {
    const stats = await User.aggregate(
      getLeaderboardPipeline({
        currentStartDate: last30DaysStart,
        currentEndDate: today,
        departmentId: user.department._id,
        userId: user._id,
      })
    );

    const routineChartResult = await RoutineTask.aggregate(
      getUserRoutineTaskStatisticsForChartPipeline({
        currentEndDate: today,
        currentStartDate: last30DaysStart,
        dateRange: dateRange,
        departmentId: user.department._id,
        userId: user._id,
      })
    );

    const routineChartData =
      routineChartResult.length > 0
        ? routineChartResult[0]
        : { routineSeries: [] };

    const assignedChartResult = await Task.aggregate(
      getUserTaskStatisticsForChartPipeline({
        currentStartDate: last30DaysStart,
        currentEndDate: today,
        dateRange,
        departmentId: user.department._id,
        userId: user._id,
      })
    );

    const assignedChartData =
      assignedChartResult.length > 0
        ? assignedChartResult[0]
        : { assignedSeries: [] };

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject({ virtuals: true }),
        assignedTaskCount: stats[0]?.assignedTaskCount || 0,
        routineTaskCount: stats[0]?.routineTaskCount || 0,
        totalCompleted: stats[0]?.totalCompleted || 0,
        rating: stats[0]?.rating || 0,
        daysInLast30,
        ...assignedChartData,
        ...routineChartData,
      },
      message: "User profile retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
});

export {
  createUser,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getUserProfileById,
};
