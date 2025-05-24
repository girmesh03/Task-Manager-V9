import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import CustomError from "../errorHandler/CustomError.js";

export const verifyJWT = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return next(new CustomError("Unauthorized: No token provided", 401));
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, decoded) => {
    if (err) {
      return next(
        new CustomError("Unauthorized: Invalid or expired token", 401)
      );
    }

    try {
      // Ensure the user still exists
      const user = await User.findById(decoded._id);
      if (!user) {
        return next(new CustomError("Unauthorized: User not found", 401));
      }

      // Check if user is not verified and not active
      if (!user.isVerified && !user.isActive) {
        return next(
          new CustomError(
            "Unauthorized: User is not verified and not active",
            403
          )
        );
      }

      req.user = decoded; // Attach decoded token (no extra user data)

      next();
    } catch (error) {
      return next(new CustomError("Internal Server Error", 500));
    }
  });
};

export const authorizeRoles = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      const error = new CustomError(
        "You are not authorized to perform this action",
        403
      );
      next(error);
    }
    next();
  };
};

export const verifyDepartmentAccess = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { departmentId } = req.params;
    const userId = req.user._id;

    // Validate user and department, even superAdmin and Admin
    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError("User not found", 404);

    // SuperAdmin bypass
    if (user.role === "SuperAdmin") {
      await session.commitTransaction();
      return next();
    }

    const department = await Department.findById(departmentId).session(session);
    if (!department) throw new CustomError("Department not found", 404);
    if (!user?.department.equals(departmentId)) {
      throw new CustomError("Department access denied", 403);
    }

    await session.commitTransaction();
    next();
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
