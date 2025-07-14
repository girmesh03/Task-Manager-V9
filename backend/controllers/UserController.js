import mongoose from "mongoose";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import Task from "../models/TaskModel.js";
import RoutineTask from "../models/RoutineTaskModel.js";
import TaskActivity from "../models/TaskActivityModel.js";
import Notification from "../models/NotificationModel.js";
import { sendVerificationEmail } from "../utils/SendEmail.js";
import { getLeaderboardPipeline } from "../pipelines/Dashboard.js";
import {
  getUserTaskStatisticsForChartPipeline,
  getUserRoutineTaskStatisticsForChartPipeline,
  fetchUserStatistics,
} from "../pipelines/user.js";
import { getDateIntervals,customDayjs } from "../utils/GetDateIntervals.js";
import { emitToUser, emitToManagers } from "../utils/SocketEmitter.js";

// Authorization middleware for SuperAdmin-only operations
const verifySuperAdmin = (req, res, next) => {
  if (req.user.role !== "SuperAdmin") {
    return next(
      new CustomError("Forbidden: Requires SuperAdmin privileges", 403)
    );
  }
  next();
};

// @desc    Create user
// @route   POST /api/users/department/:departmentId
// @access  Private (SuperAdmin)
const createUser = asyncHandler(async (req, res, next) => {
  verifySuperAdmin(req, res, async () => {
    const { departmentId } = req.params;
    const {
      firstName,
      lastName,
      email,
      password,
      role = "User",
      position,
    } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate required fields
      if (!firstName || !lastName || !email || !password || !position) {
        throw new CustomError("All fields are required", 400);
      }

      // Check department existence
      const departmentExists = await Department.exists({
        _id: departmentId,
      }).session(session);
      if (!departmentExists) {
        throw new CustomError("Department not found", 404);
      }

      // Generate verification token
      const token = crypto.randomBytes(3).toString("hex").toUpperCase();
      const expiry = customDayjs()
        .utc(true)
        .add(15, "minutes")
        .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"); // 15 minutes
      console.log("expiry", expiry);

      // Create user
      const newUser = new User({
        firstName,
        lastName,
        email,
        password,
        role,
        department: departmentId,
        position,
        verificationToken: token,
        verificationTokenExpiry: expiry,
      });

      const createdUser = await newUser.save({ session });

      // Send verification email
      await sendVerificationEmail(
        createdUser.email,
        createdUser.verificationToken
      );

      // Create Notification
      const notification = new Notification({
        user: createdUser._id,
        type: "SystemAlert",
        message: `Welcome ${createdUser.fullName} to Task Manager!`,
        linkedDocumentType: "User",
        linkedDocument: createdUser._id,
        department: departmentId,
      });

      // Save Notification
      await notification.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Send response
      res.status(201).json({
        success: true,
        user: {
          _id: createdUser._id,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          email: createdUser.email,
          role: createdUser.role,
          position: createdUser.position,
          department: createdUser.department,
        },
        message: "User created successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  });
});

// @desc    Get all users
// @route   GET /api/users/department/:departmentId
// @access  Private (SuperAdmin: any, Other: department)
const getAllUsers = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const { page = 1, limit = 10, role } = req.query;

  // Validate department
  const department = await Department.findById(departmentId);
  if (!department) {
    return next(new CustomError("Department not found", 404));
  }

  // Authorization filter
  // let filter = { department: departmentId, isActive: true };
  let filter = { department: departmentId };

  // Apply role filter if provided
  if (role) filter.role = role;

  // Pagination and sorting
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    populate: [
      { path: "department", select: "name" },
      { path: "managedDepartment", select: "name" },
    ],
    select: "-password -tokenVersion -verificationToken -resetPasswordToken",
    sort: "-createdAt",
    lean: true,
  };

  const result = await User.paginate(filter, options);

  res.status(200).json({
    success: true,
    pagination: {
      page: result.page,
      limit: result.limit,
      totalItems: result.totalDocs,
      totalPages: result.totalPages,
    },
    users: result.docs,
    message: "Users retrieved successfully",
  });
});

// @desc    Get user
// @route   GET /api/users/department/:departmentId/user/:userId
// @access  Private (SuperAdmin: any, Other: Belongs to department)
const getUserById = asyncHandler(async (req, res, next) => {
  const { departmentId, userId } = req.params;

  const user = await User.findOne({
    _id: userId,
    department: departmentId,
    // isActive: true,
  })
    .populate({
      path: "department",
      select: "name",
      populate: {
        path: "managers",
        select: "firstName lastName email position profilePicture",
      },
    })
    .select("firstName lastName email position role profilePicture department")
    .lean();

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
    message: "User retrieved successfully",
  });
});

// @desc    Update user
// @route   PUT /api/users/department/:departmentId/user/:userId
// @access  Private (SuperAdmin)
const updateUserById = asyncHandler(async (req, res, next) => {
  verifySuperAdmin(req, res, async () => {
    const { departmentId, userId } = req.params;
    const updates = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user
      const user = await User.findOne({
        _id: userId,
        department: departmentId,
      }).session(session);

      if (!user) {
        throw new CustomError("User not found", 404);
      }

      // Prevent email changes
      if (updates.email) {
        throw new CustomError("Email cannot be changed on this endpoint", 400);
      }

      // Handle role changes
      // if (updates.role) {
      //   // Prevent creating additional SuperAdmins
      //   if (updates.role === "SuperAdmin") {
      //     const existingSuperAdmin = await User.findOne({
      //       department: user.department,
      //       role: "SuperAdmin",
      //       _id: { $ne: userId },
      //     }).session(session);

      //     if (existingSuperAdmin) {
      //       throw new CustomError(
      //         "Only one SuperAdmin allowed per department",
      //         400
      //       );
      //     }
      //   }

      //   // Update user role
      //   user.role = updates.role;
      // }

      // Update other fields
      if (updates.firstName) user.firstName = updates.firstName;
      if (updates.lastName) user.lastName = updates.lastName;
      if (updates.position) user.position = updates.position;
      if (updates.role) user.role = updates.role;
      if (updates.hasOwnProperty("isActive")) user.isActive = updates.isActive;
      if (updates.hasOwnProperty("isVerified"))
        user.isActive = updates.isVerified;

      await user.validate({ session });
      await user.save({ session });

      // Create notification if role changed
      if (updates.role) {
        const notification = new Notification({
          user: userId,
          type: "SystemAlert",
          message: `Your role was changed to ${updates.role}`,
          department: departmentId,
          linkedDocument: userId,
          linkedDocumentType: "User",
        });
        await notification.save({ session });
        emitToUser(userId, "role-change", {
          message: `Your role was changed to ${updates.role}`,
        });
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          position: user.position,
          department: user.department,
        },
        message: "User updated successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/department/:departmentId/user/:userId
// @access  Private (SuperAdmin)
const deleteUserById = asyncHandler(async (req, res, next) => {
  verifySuperAdmin(req, res, async () => {
    const { departmentId, userId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user
      const user = await User.findOne({
        _id: userId,
        department: departmentId,
      })
        .session(session)
        .populate("department");

      if (!user) {
        throw new CustomError("User not found", 404);
      }

      // Prevent deletion of protected roles with active dependencies
      if (["SuperAdmin", "Admin", "Manager"].includes(user.role)) {
        const [taskCount, managedDepartments] = await Promise.all([
          Task.countDocuments({ createdBy: userId }).session(session),
          Department.countDocuments({ managers: userId }).session(session),
        ]);

        if (taskCount > 0 || managedDepartments > 0) {
          throw new CustomError(
            `Cannot delete ${user.role} with active dependencies`,
            400
          );
        }
      }

      // Special handling for SuperAdmin
      if (user.role === "SuperAdmin") {
        const otherSuperAdmins = await User.countDocuments({
          department: user.department._id,
          role: "SuperAdmin",
          _id: { $ne: userId },
        }).session(session);

        if (otherSuperAdmins === 0) {
          throw new CustomError(
            "Cannot delete last SuperAdmin in department",
            400
          );
        }
      }

      // Cascade deletion operations
      await Promise.all([
        // Delete tasks created by user
        Task.deleteMany({ createdBy: userId }).session(session),

        // Delete task activities performed by user
        TaskActivity.deleteMany({ performedBy: userId }).session(session),

        // Remove user from department manager lists
        Department.updateMany(
          { managers: userId },
          { $pull: { managers: userId } },
          { session }
        ),

        // Remove user from task assignments
        Task.updateMany(
          { "assignedTo.assignedTo": userId },
          { $pull: { assignedTo: { assignedTo: userId } } },
          { session }
        ),

        // Delete user notifications
        Notification.deleteMany({
          $or: [{ user: userId }, { "linkedDocument.user": userId }],
        }).session(session),
      ]);

      // Finally delete the user
      await user.deleteOne({ session });

      // Notify managers
      await emitToManagers(user.department._id, "user-deleted", {
        message: `User ${user.firstName} ${user.lastName} was deleted`,
        userId,
      });

      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: "User and associated data deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  });
});

// @desc    Get user profile
// @route   GET /api/users/department/:departmentId/user/:userId/profile
// @access  Private (SuperAdmin:any, Other: Belongs to department)
const getUserProfileById = asyncHandler(async (req, res, next) => {
  const { departmentId, userId } = req.params;
  const { currentDate } = req.query;

  // Get user
  const user = await User.findOne({
    _id: userId,
    department: departmentId,
    // isActive: true,
  })
    .populate("department", "name")
    .select("firstName lastName email position role profilePicture department")
    .lean();

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Get date intervals
  const dates = getDateIntervals(currentDate);
  if (!dates) return next(new CustomError("Invalid date format", 400));

  const { last30DaysStart, last30DaysEnd: today, daysInLast30 } = dates;

  try {
    const [stats, routineChartResult, assignedChartResult] = await Promise.all([
      // User statistics
      User.aggregate(
        getLeaderboardPipeline({
          currentStartDate: last30DaysStart,
          currentEndDate: today,
          departmentId: user.department._id,
          userId: user._id,
        })
      ),

      // Routine task statistics
      RoutineTask.aggregate(
        getUserRoutineTaskStatisticsForChartPipeline({
          currentEndDate: today,
          currentStartDate: last30DaysStart,
          dateRange: dates.dateRange,
          departmentId: user.department._id,
          userId: user._id,
        })
      ),

      // Assigned task statistics
      Task.aggregate(
        getUserTaskStatisticsForChartPipeline({
          currentStartDate: last30DaysStart,
          currentEndDate: today,
          dateRange: dates.dateRange,
          departmentId: user.department._id,
          userId: user._id,
        })
      ),
    ]);

    // Format response data
    const statsData = stats[0] || {
      assignedTaskCount: 0,
      routineTaskCount: 0,
      totalCompleted: 0,
      rating: 0,
    };

    const routineData = routineChartResult[0] || { routineSeries: [] };
    const assignedData = assignedChartResult[0] || { assignedSeries: [] };

    res.status(200).json({
      success: true,
      user: {
        ...user,
        ...statsData,
        ...routineData,
        ...assignedData,
        daysInLast30,
      },
      message: "User profile retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get users statistics
// @route   GET /api/users/department/:departmentId/statistics
// @access  Private (SuperAdmin: any, Other: Belongs to department)
const getUsersStatistics = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const requester = req.user;
  let { currentDate, page = 1, limit = 10 } = req.query;

  // Validate department ID
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    return next(new CustomError("Invalid department ID", 400));
  }

  // Parse and validate pagination parameters
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  // Get date intervals
  const dates = getDateIntervals(currentDate);
  if (!dates) return next(new CustomError("Invalid date format", 400));

  const { last30DaysStart: startOfDay, last30DaysEnd: endOfDay } = dates;

  try {
    const result = await fetchUserStatistics({
      departmentId: new mongoose.Types.ObjectId(departmentId),
      userPerformingActionRole: requester.role,
      startDate: startOfDay,
      endDate: endOfDay,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: {
        rows: result.rows.map((row) => ({
          ...row,
          id: row._id.toString(),
        })),
        page,
        pageSize: limit,
        rowCount: result.rowCount,
      },
      message: "Statistics retrieved successfully",
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
  getUsersStatistics,
};
