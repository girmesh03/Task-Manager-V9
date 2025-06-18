import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import CustomError from "../errorHandler/CustomError.js";

const ROLE_HIERARCHY = {
  User: 1,
  Manager: 2,
  Admin: 3,
  SuperAdmin: 4,
};

export const verifyJWT = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return next(
      new CustomError("Unauthorized: No token provided", 401, "AUTH-401")
    );
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, decoded) => {
    if (err) {
      const errorType =
        err.name === "TokenExpiredError"
          ? new CustomError("Token expired", 401, "AUTH-401")
          : new CustomError("Invalid token", 401, "AUTH-401");
      return next(errorType);
    }

    try {
      const user = await User.findById(decoded._id);
      if (!user) {
        return next(new CustomError("User not found", 404, "USER-404"));
      }

      if (!user.isVerified || !user.isActive) {
        return next(
          new CustomError(
            "Account not verified or inactive",
            403,
            "ACCOUNT-403"
          )
        );
      }

      req.user = {
        _id: user._id,
        role: user.role,
        department: user.department,
      };
      next();
    } catch (error) {
      next(new CustomError("Authentication failed", 500, "AUTH-500"));
    }
  });
};

export const authorizeRoles = (...requiredRoles) => {
  return (req, res, next) => {
    const userRoleLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = Math.max(
      ...requiredRoles.map((role) => ROLE_HIERARCHY[role])
    );

    if (userRoleLevel < requiredLevel) {
      return next(
        new CustomError("Insufficient permissions", 403, "PERMISSION-403")
      );
    }
    next();
  };
};

export const verifyDepartmentAccess = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const userId = req.user._id;

    // SuperAdmin bypass
    if (req.user.role === "SuperAdmin") return next();

    // Validate department ID format
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw new CustomError("Invalid department ID", 400, "DEPT-400");
    }

    // Check user-department association
    const user = await User.findById(userId).select("department");
    if (!user.department.equals(departmentId)) {
      throw new CustomError("Department access denied", 403, "DEPT-403");
    }
    next();
  } catch (error) {
    next(error);
  }
};
