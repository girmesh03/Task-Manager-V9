import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import CustomError from "../errorHandler/CustomError.js";
import User from "../models/UserModel.js";

import {
  sendResetPasswordEmail,
  sendRestSuccessEmail,
} from "../utils/SendEmail.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/GenerateTokens.js";

import { getFormattedDate } from "../utils/GetDateIntervals.js";
import dayjs from "dayjs";

// @desc Login
// @route POST /api/auth/login
// @access Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return next(new CustomError("Email and password are required", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).populate({
    path: "department",
    select: "name description managers",
    populate: {
      path: "managers",
      select: "firstName lastName email role profilePicture",
    },
  });

  if (!user) return next(new CustomError("Invalid credentials", 401));
  if (!(await user.matchPassword(password))) {
    return next(new CustomError("Invalid credentials", 401));
  }

  if (!user.isVerified) {
    return next(new CustomError("Please verify your email first", 403));
  }

  if (!user.isActive) {
    return next(
      new CustomError("Account deactivated - contact administrator", 403)
    );
  }

  generateAccessToken(res, user);
  generateRefreshToken(res, user);

  res.status(200).json({
    success: true,
    user,
    message: "Login successful",
  });
});

// @desc Verify user email
// @route POST /api/auth/verify-email
// @access Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) return next(new CustomError("Verification token required", 400));

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiry: {
      $gt: getFormattedDate(dayjs().format("YYYY-MM-DD"), 0),
    },
  }).select("+verificationToken +verificationTokenExpiry");

  if (!user) {
    // Delete user with expired token
    const invalidUser = await User.findOne({ verificationToken: token });
    if (invalidUser) await User.findOneAndDelete({ verificationToken: token });

    // Return error with expired token
    return next(new CustomError("Invalid/expired token", 400));
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  generateAccessToken(res, user);
  generateRefreshToken(res, user);

  const updatedUser = await User.findById(user._id).populate({
    path: "department",
    select: "name description",
    populate: {
      path: "managers",
      select: "firstName lastName email role profilePicture",
    },
  });

  res.status(200).json({
    success: true,
    user: updatedUser,
    message: "Email verified successfully",
  });
});

// @desc Logout
// @route POST /api/auth/logout
// @access Private
const logout = asyncHandler(async (req, res) => {
  res.cookie("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: getFormattedDate(dayjs().format("YYYY-MM-DD"), 0),
  });

  res.cookie("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: getFormattedDate(dayjs().format("YYYY-MM-DD"), 0),
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// @desc Forgot password
// @route POST /api/auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

  // check if email is provided
  if (!email?.trim()) {
    return next(new CustomError("Email is required", 400));
  }

  // check if email is valid
  if (!emailRegex.test(email)) {
    return next(new CustomError("Invalid email format", 400));
  }

  // check if email exists
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new CustomError("Account does not exist", 404));
  }
  if (!user.isVerified) {
    return next(new CustomError("Please verify your email first", 403));
  }

  // generate reset token
  user.generatePasswordResetToken();
  await user.save();
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${user.resetPasswordToken}`;
  await sendResetPasswordEmail(user.email, resetURL);

  res.status(200).json({
    success: true,
    message: "If account exists, reset instructions will be sent",
  });
});

// @desc Reset password
// @route POST /api/auth/reset-password/:resetToken
// @access Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  if (!password?.trim()) {
    return next(new CustomError("Password is required", 400));
  }

  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpiry: {
      $gt: getFormattedDate(dayjs().format("YYYY-MM-DD"), 0),
    },
  });

  if (!user) return next(new CustomError("Invalid/expired token", 400));

  if (!user.isVerified) {
    return next(new CustomError("Please verify your email first", 403));
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  await sendRestSuccessEmail(user.email);

  res.cookie("access_token", "", {
    expires: getFormattedDate(dayjs().format("YYYY-MM-DD"), 0),
  });
  res.cookie("refresh_token", "", {
    expires: getFormattedDate(dayjs().format("YYYY-MM-DD"), 0),
  });

  res.status(200).json({
    success: true,
    message: "Password reset successfully. Please login",
  });
});

// @desc Get refresh token
// @route GET /api/auth/refresh
// @access Public
const getRefreshToken = asyncHandler(async (req, res, next) => {
  const currentRefreshToken = req.cookies.refresh_token;
  if (!currentRefreshToken) return next(new CustomError("Unauthorized", 401));

  let decoded;
  try {
    decoded = jwt.verify(currentRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return next(new CustomError("Invalid token", 403));
  }

  const user = await User.findById(decoded._id).select(
    "+tokenVersion +isActive"
  );
  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    return next(new CustomError("Token revoked", 403));
  }

  if (!user.isActive) return next(new CustomError("Account deactivated", 403));

  user.tokenVersion += 1;
  await user.save();

  generateAccessToken(res, user);
  generateRefreshToken(res, user);

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
  });
});

// @desc Get logged in user
// @route GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res, next) => {
  // Get access token from cookies
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    return next(new CustomError("Not authorized - no token", 401));
  }

  try {
    // Verify access token
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    // Find user with populated department data
    const user = await User.findById(decoded._id)
      .select("+isVerified +isActive")
      .populate({
        path: "department",
        select: "name description",
        populate: {
          path: "managers",
          select: "firstName lastName email role profilePicture",
        },
      });

    if (!user) {
      return next(new CustomError("User not found", 404));
    }

    // Check account status
    if (!user.isVerified) {
      return next(new CustomError("Please verify your email first", 403));
    }

    if (!user.isActive) {
      return next(
        new CustomError("Account deactivated - contact administrator", 403)
      );
    }

    // Return user data without sensitive information
    const userData = user.toObject();
    delete userData.password;
    delete userData.tokenVersion;

    res.status(200).json({
      success: true,
      user: userData,
      message: "User retrieved successfully",
    });
  } catch (error) {
    // Handle different JWT error types
    if (error.name === "TokenExpiredError") {
      return next(new CustomError("Session expired - please login again", 401));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new CustomError("Invalid token - please login again", 401));
    }
    next(error);
  }
});

export {
  login,
  verifyEmail,
  logout,
  forgotPassword,
  resetPassword,
  getRefreshToken,
  getMe,
};
