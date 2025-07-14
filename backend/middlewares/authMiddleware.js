// backend/middlewares/authMiddleware.js
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import CustomError from "../errorHandler/CustomError.js";

export const verifyJWT = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return next(new CustomError("Authorization token required", 401));
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, decoded) => {
    if (err) {
      return next(new CustomError(`${err.message}`, 401));
    }

    try {
      const user = await User.findById(decoded._id).select(
        "+isVerified +isActive +tokenVersion"
      );
      if (!user) {
        return next(new CustomError("User account not found", 404));
      }

      if (!user.isVerified || !user.isActive) {
        return next(new CustomError("Account not activated or suspended", 403));
      }

      if (user.tokenVersion !== decoded.tokenVersion) {
        return next(new CustomError("Session expired", 401));
      }

      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  });
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError("Insufficient permissions for this action", 403)
      );
    }
    next();
  };
};

export const verifyDepartmentAccess = async (req, res, next) => {
  const { departmentId } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select("department role");
    if (!user) throw new CustomError("User account not found", 404);

    // SuperAdmin bypass
    if (user.role === "SuperAdmin") return next();

    const department = await mongoose
      .model("Department")
      .exists({ _id: departmentId });
    if (!department) throw new CustomError("Department not found", 404);

    if (!user.department.equals(departmentId)) {
      throw new CustomError("Department access denied", 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};
