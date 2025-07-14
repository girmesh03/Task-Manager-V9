import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import Notification from "../models/NotificationModel.js";
import { emitToUser } from "../utils/SocketEmitter.js";

// Authorization middleware for SuperAdmin-only operations
const verifySuperAdmin = (req, res, next) => {
  if (req.user.role !== "SuperAdmin") {
    return next(
      new CustomError("Forbidden: Requires SuperAdmin privileges", 403)
    );
  }
  next();
};

// @desc    Create Department
// @route   POST /api/departments
// @access  Private (SuperAdmin)
const createDepartment = asyncHandler(async (req, res, next) => {
  verifySuperAdmin(req, res, async () => {
    const { name, description, managers = [] } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate manager IDs
      const invalidManagerIds = managers.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      );

      if (invalidManagerIds.length > 0) {
        throw new CustomError(
          `Invalid manager IDs: ${invalidManagerIds.join(", ")}`,
          400
        );
      }

      // Create department
      const department = new Department({ name, description, managers });
      await department.save({ session });

      // Process managers
      await Promise.all(
        managers.map(async (userId) => {
          const user = await User.findById(userId).session(session);
          if (!user) {
            throw new CustomError(`User ${userId} not found`, 404);
          }

          // Update user role/department
          if (!["Manager", "Admin", "SuperAdmin"].includes(user.role)) {
            user.role = "Manager";
          }
          user.department = department._id;
          await user.save({ session });

          // Create notification
          const notification = new Notification({
            user: user._id,
            message: `You've been assigned as manager for ${department.name} department`,
            type: "SystemAlert",
            department: department._id,
            linkedDocument: department._id,
            linkedDocumentType: "Department",
          });
          await notification.save({ session });

          // Emit socket event
          emitToUser(user._id, "role-update", {
            message: `You've been made manager of ${department.name}`,
            departmentId: department._id,
          });
        })
      );

      await session.commitTransaction();
      res.status(201).json({
        success: true,
        department,
        message: "Department created successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  });
});

// @desc    Get departments
// @route   GET /api/departments?page=1&limit=10
// @access  Private (SuperAdmin: any, Other: Own department)
const getAllDepartments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const requestor = req.user;

  // Pagination setup
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    populate: {
      path: "managers",
      select: "firstName lastName fullName position email role profilePicture",
    },
    sort: { createdAt: -1 },
    lean: true,
  };

  // Authorization filter
  const filter = ["SuperAdmin", "Admin"].includes(requestor.role)
    ? {}
    : { _id: requestor.department };

  const departments = await Department.paginate(filter, options);

  // Enrich with member counts
  const departmentsWithCounts = await Promise.all(
    departments.docs.map(async (dept) => ({
      ...dept,
      memberCount: await User.countDocuments({ department: dept._id }),
    }))
  );

  res.status(200).json({
    success: true,
    pagination: {
      page: departments.page,
      limit: departments.limit,
      totalItems: departments.totalDocs,
      totalPages: departments.totalPages,
    },
    departments: departmentsWithCounts,
    message: "Departments retrieved successfully",
  });
});

// @desc    Get department by departmentId
// @route   GET /api/departments/:departmentId
// @access  Private (SuperAdmin: any, Other: Own department)
const getDepartmentById = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const requestor = req.user;

  // Authorization check
  if (
    !["SuperAdmin", "Admin"].includes(requestor.role) &&
    !requestor.department.equals(departmentId)
  ) {
    return next(new CustomError("Unauthorized to access this department", 403));
  }

  const department = await Department.findById(departmentId)
    .populate({
      path: "managers",
      select: "firstName lastName fullName position email role profilePicture",
    })
    .lean();

  if (!department) {
    return next(new CustomError("Department not found", 404));
  }

  // Add member count
  department.memberCount = await User.countDocuments({
    department: departmentId,
  });

  res.status(200).json({
    success: true,
    department,
    message: "Department retrieved successfully",
  });
});

// @desc    Update Department
// @route   PUT /api/departments/:departmentId
// @access  Private (SuperAdmin)
const updateDepartmentById = asyncHandler(async (req, res, next) => {
  verifySuperAdmin(req, res, async () => {
    const { departmentId } = req.params;
    const { name, description, managers } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate department ID
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        throw new CustomError("Invalid department ID format", 400);
      }

      // Validate managers
      if (managers !== undefined && !Array.isArray(managers)) {
        throw new CustomError("Managers must be an array", 400);
      }

      // Find existing department
      const existingDept = await Department.findById(departmentId).session(
        session
      );
      if (!existingDept) {
        throw new CustomError("Department not found", 404);
      }

      // Check for SuperAdmin in department
      const superAdminCount = await User.countDocuments({
        department: departmentId,
        role: "SuperAdmin",
      }).session(session);

      // Prevent modification of SuperAdmin department if it's the only one
      if (superAdminCount > 0) {
        const totalSuperAdmins = await User.countDocuments({
          role: "SuperAdmin",
        }).session(session);

        if (totalSuperAdmins === superAdminCount) {
          throw new CustomError(
            "Cannot modify department containing the only SuperAdmin",
            400
          );
        }
      }

      // Name uniqueness check
      if (name && name.trim() !== existingDept.name) {
        const duplicate = await Department.findOne({
          name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
          _id: { $ne: departmentId },
        }).session(session);

        if (duplicate) {
          throw new CustomError("Department name already exists", 409);
        }
      }

      // Process managers
      const currentManagers = existingDept.managers.map((id) => id.toString());
      const newManagers = managers?.map((id) => id.toString()) || [];

      const addedManagers = newManagers.filter(
        (id) => !currentManagers.includes(id)
      );
      const removedManagers = currentManagers.filter(
        (id) => !newManagers.includes(id)
      );

      // Validate manager IDs
      const allManagerIds = [...newManagers];
      const invalidManagerIds = allManagerIds.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      );

      if (invalidManagerIds.length > 0) {
        throw new CustomError(
          `Invalid manager IDs: ${invalidManagerIds.join(", ")}`,
          400
        );
      }

      // Handle added managers
      await Promise.all(
        addedManagers.map(async (userId) => {
          const user = await User.findById(userId).session(session);
          if (!user) throw new CustomError(`User ${userId} not found`, 404);

          if (!user.isActive || !user.isVerified) {
            throw new CustomError(
              `User ${user.email} is inactive/unverified`,
              400
            );
          }

          // Update user role/department
          if (!["Manager", "Admin", "SuperAdmin"].includes(user.role)) {
            user.role = "Manager";
          }
          user.department = departmentId;
          await user.save({ session });

          // Create notification
          const notification = new Notification({
            user: user._id,
            message: `You were added as manager to ${
              name || existingDept.name
            } department`,
            type: "SystemAlert",
            department: departmentId,
            linkedDocument: departmentId,
            linkedDocumentType: "Department",
          });
          await notification.save({ session });

          // Emit socket event
          emitToUser(user._id, "role-update", {
            message: `You were added as manager to ${
              name || existingDept.name
            }`,
            departmentId,
          });
        })
      );

      // Handle removed managers
      await Promise.all(
        removedManagers.map(async (userId) => {
          const user = await User.findById(userId).session(session);
          if (!user) return;

          // Check if user is manager in other departments
          const otherManagerRoles = await Department.countDocuments({
            managers: userId,
            _id: { $ne: departmentId },
          }).session(session);

          // Downgrade role if no other manager positions
          if (!otherManagerRoles) {
            user.role = "User";
            await user.save({ session });

            // Create notification
            const notification = new Notification({
              user: user._id,
              message: `You were removed as manager from ${existingDept.name} department`,
              type: "SystemAlert",
              department: departmentId,
              linkedDocument: departmentId,
              linkedDocumentType: "Department",
            });
            await notification.save({ session });

            emitToUser(user._id, "role-update", {
              message: `You were removed as manager from ${existingDept.name}`,
              departmentId,
            });
          }
        })
      );

      // Format name and description
      const formattedName = name ? name.trim() : existingDept.name;
      const formattedDescription = description || existingDept.description;

      // Update department
      existingDept.name = formattedName;
      existingDept.description = formattedDescription;
      existingDept.managers = newManagers;

      // Save
      await existingDept.save({ session });

      // Commit transaction
      await session.commitTransaction();

      // Prepare response
      const response = await Department.findById(departmentId).populate({
        path: "managers",
        select:
          "firstName lastName fullName position email role profilePicture",
      });

      // Send response
      res.status(200).json({
        success: true,
        department: response,
        message: "Department updated successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  });
});

// @desc    Delete Department
// @route   DELETE /api/departments/:departmentId
// @access  Private (SuperAdmin)
const deleteDepartmentById = asyncHandler(async (req, res, next) => {
  verifySuperAdmin(req, res, async () => {
    const { departmentId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get department
      const department = await Department.findById(departmentId).session(
        session
      );
      if (!department) {
        throw new CustomError("Department not found", 404);
      }

      // Check for SuperAdmin in department
      const superAdminCount = await User.countDocuments({
        department: departmentId,
        role: "SuperAdmin",
      }).session(session);

      // Prevent deletion if it contains the only SuperAdmin
      if (superAdminCount > 0) {
        const totalSuperAdmins = await User.countDocuments({
          role: "SuperAdmin",
        }).session(session);

        if (totalSuperAdmins === superAdminCount) {
          throw new CustomError(
            "Cannot delete department containing the only SuperAdmin",
            400
          );
        }
      }

      // Delete department (triggers schema cascade hooks)
      await department.deleteOne({ session });

      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  });
});

export {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartmentById,
  deleteDepartmentById,
};
