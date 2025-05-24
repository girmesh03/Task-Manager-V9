import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import Notification from "../models/NotificationModel.js";

// @desc    Create Department
// @route   POST /api/departments
// @access  Private (SuperAdmin)
const createDepartment = asyncHandler(async (req, res, next) => {
  const { name, description, managers } = req.body;

  // Basic validation
  if (!name?.trim()) {
    return next(new CustomError("Department name is required", 400));
  }

  // Validate managers is an array
  if (managers && !Array.isArray(managers)) {
    return next(new CustomError("Managers must be an array", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for existing department (case-insensitive)
    const existingDept = await Department.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    }).session(session);

    if (existingDept) {
      throw new CustomError("Department name already exists", 409);
    }

    // Create new department
    const department = await Department.create(
      [
        {
          name: name.trim(),
          description,
          managers: managers || [],
        },
      ],
      { session }
    );

    const createdDepartment = department[0];

    // Process managers if provided
    if (managers?.length) {
      await Promise.all(
        managers.map(async (userId) => {
          const user = await User.findById(userId).session(session);

          if (!user) {
            throw new CustomError(`User ${userId} not found`, 404);
          }
          if (!user.isActive || !user.isVerified) {
            throw new CustomError(
              `User ${user.email} is inactive or unverified`,
              400
            );
          }

          // Update user role and department
          user.role = "Manager";
          user.department = createdDepartment._id;
          await user.save({ session });

          // Create notification
          await Notification.create(
            [
              {
                user: user._id,
                message: `You've been assigned as manager for ${createdDepartment.name} department`,
                type: "SystemAlert",
                department: createdDepartment._id,
                linkedDocument: user._id,
                linkedDocumentType: "User",
              },
            ],
            { session }
          );
        })
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      department: createdDepartment,
      message: "Department created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

// @desc    Get departments
// @route   GET /api/departments?page=1&limit=10
// @access  Private (SuperAdmin, Admin, Manager, User)
const getAllDepartments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const requestor = req.user;

  // Validate valid roles
  const validRoles = ["SuperAdmin", "Admin", "Manager", "User"];
  if (!validRoles.includes(requestor.role)) {
    return next(new CustomError("Unauthorized role", 403));
  }

  // Validate pagination parameters
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.max(1, parseInt(limit));
  const skip = (parsedPage - 1) * parsedLimit;

  const aggregationPipeline = [
    {
      $sort: { createdAt: -1 }, // Newest first
    },
    {
      $lookup: {
        from: "users",
        localField: "managers",
        foreignField: "_id",
        as: "managers",
        pipeline: [
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              role: 1,
              profilePicture: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "tasks",
        let: { departmentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$department", "$$departmentId"] } } },
          { $count: "count" },
        ],
        as: "taskCounts",
      },
    },
    {
      $addFields: {
        taskCount: { $ifNull: [{ $arrayElemAt: ["$taskCounts.count", 0] }, 0] },
      },
    },
    {
      $project: {
        taskCounts: 0,
        __v: 0,
      },
    },
    { $skip: skip },
    { $limit: parsedLimit },
  ];

  // Filter departments based on user role
  let departments = await Department.aggregate(aggregationPipeline);

  const adminRoles = ["SuperAdmin", "Admin"];
  departments = adminRoles.includes(requestor.role)
    ? departments
    : departments.filter((dept) => dept._id.equals(requestor.departmentId));

  // Count total documents based on user role
  const totalCount = adminRoles.includes(requestor.role)
    ? await Department.countDocuments()
    : 1; // Only one department for User and Manager

  res.status(200).json({
    success: true,
    departments,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / parsedLimit),
    },
    message: "Departments retrieved successfully",
  });
});

// @desc    Get department by departmentId
// @route   GET /api/departments/:departmentId
// @access  Private (SuperAdmin, Admin, Manager, User)
const getDepartmentById = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;

  // Validate MongoDB ID format
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    return next(new CustomError("Invalid department ID format", 400));
  }

  const aggregationPipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(departmentId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "managers",
        foreignField: "_id",
        as: "managers",
        pipeline: [
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              role: 1,
              profilePicture: 1,
              isActive: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "tasks",
        let: { departmentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$department", "$$departmentId"] } } },
          { $count: "count" },
        ],
        as: "taskStats",
      },
    },
    {
      $addFields: {
        taskCount: { $ifNull: [{ $arrayElemAt: ["$taskStats.count", 0] }, 0] },
        activeManagers: {
          $filter: {
            input: "$managers",
            as: "manager",
            cond: { $eq: ["$$manager.isActive", true] },
          },
        },
      },
    },
    {
      $project: {
        taskStats: 0,
        __v: 0,
        "managers.isActive": 0,
      },
    },
  ];

  const result = await Department.aggregate(aggregationPipeline);

  if (!result.length) {
    return next(new CustomError("Department not found", 404));
  }

  const department = result[0];

  res.status(200).json({
    success: true,
    department,
    message: "Department retrieved successfully",
  });
});

// @desc    Update Department
// @route   PUT /api/departments/:departmentId
// @access  Private (SuperAdmin Only)
const updateDepartmentById = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const { name, description, managers } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw new CustomError("Invalid department ID format", 400);
    }

    // 2. Find existing department
    const existingDept = await Department.findById(departmentId).session(
      session
    );
    if (!existingDept) {
      throw new CustomError("Department not found", 404);
    }

    // 3. Name uniqueness check (case-insensitive)
    if (name && name.trim() !== existingDept.name) {
      const duplicate = await Department.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        _id: { $ne: departmentId },
      }).session(session);

      if (duplicate)
        throw new CustomError("Department name already exists", 409);
    }

    // 4. Process managers changes
    const currentManagers = existingDept.managers.map((id) => id.toString());
    const newManagers = managers?.map((id) => id.toString()) || [];

    const addedManagers = newManagers.filter(
      (id) => !currentManagers.includes(id)
    );
    const removedManagers = currentManagers.filter(
      (id) => !newManagers.includes(id)
    );

    // 5. Prevent SuperAdmin removal validation
    for (const userId of removedManagers) {
      const user = await User.findById(userId).session(session);

      // Critical check: Prevent removing SuperAdmin from their own department
      if (user.role === "SuperAdmin" && user.department.equals(departmentId)) {
        throw new CustomError(
          `Cannot remove SuperAdmin (${user.email}) from their assigned department`,
          400
        );
      }
    }

    //  6. Handle removed managers
    for (const userId of addedManagers) {
      const user = await User.findById(userId).session(session);

      // Validation checks
      if (!user) throw new CustomError(`User ${userId} not found`, 404);
      if (!user.isActive || !user.isVerified) {
        throw new CustomError(`User ${user.email} is inactive/unverified`, 400);
      }

      // Update user role and department
      user.role = "Manager";
      user.department = departmentId;
      await user.save({ session });

      // Add notification
      await Notification.create(
        [
          {
            user: user._id,
            message: `You were added as manager to ${
              name || existingDept.name
            } department`,
            type: "SystemAlert",
            department: departmentId,
            linkedDocument: user._id,
            linkedDocumentType: "User",
          },
        ],
        { session }
      );
    }

    // 6. Handle removed managers
    for (const userId of removedManagers) {
      const user = await User.findById(userId).session(session);

      // Check if user is manager in other departments
      const otherManagerRoles = await Department.countDocuments({
        managers: userId,
        _id: { $ne: departmentId },
      }).session(session);

      // Downgrade role if no other manager positions
      if (!otherManagerRoles) {
        user.role = "User";
        await user.save({ session });

        // Add notification
        await Notification.create(
          [
            {
              user: user._id,
              message: `You were removed as manager from ${existingDept.name} department`,
              type: "SystemAlert",
              department: departmentId,
              linkedDocument: user._id,
              linkedDocumentType: "User",
            },
          ],
          { session }
        );
      }
    }

    // 7. Update department document
    const updatePayload = {
      ...(name && { name: name.trim() }),
      ...(description && { description }),
      ...(managers && { managers: newManagers }),
    };

    const updatedDepartment = await Department.findByIdAndUpdate(
      departmentId,
      updatePayload,
      { new: true, session }
    ).populate({
      path: "managers",
      select: "_id firstName lastName email role profilePicture",
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      department: updatedDepartment,
      message: "Department updated successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

// @desc    Delete Department and all associated data
// @route   DELETE /api/departments/:departmentId
// @access  Private (SuperAdmin Only)
const deleteDepartmentById = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 1. Validate ID format
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        throw new CustomError("Invalid department ID format", 400);
      }

      // 2. Find department and check existence
      const department = await Department.findById(departmentId).session(
        session
      );
      if (!department) throw new CustomError("Department not found", 404);

      // 3. Attach current user to document for middleware validation
      department.$currentUser = req.user; // REQUIRED for schema-level auth check

      // 4. Additional protection: Verify acting user is department's SuperAdmin
      const actingUser = await User.findById(req.user._id).session(session);
      if (!actingUser || actingUser.role !== "SuperAdmin") {
        throw new CustomError(
          "Unauthorized - SuperAdmin privileges required",
          403
        );
      }

      // 5. Initiate deletion (triggers middleware with session)
      await department.deleteOne({ session });
    });

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    if (session.transaction.isActive) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    session.endSession();
  }
});

export {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartmentById,
  deleteDepartmentById,
};
