import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import Notification from "../models/NotificationModel.js";
import CustomError from "../errorHandler/CustomError.js";

import {
  sendResetPasswordEmail,
  sendRestSuccessEmail,
} from "../utils/SendEmail.js";

import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "../utils/GenerateTokens.js";

import { emitToUser } from "../utils/SocketEmitter.js";
import { customDayjs } from "../utils/GetDateIntervals.js";

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return next(
        new CustomError(
          "Email and password are required",
          400,
          "MISSING_CREDENTIALS"
        )
      );
    }

    // Find user with company and department details
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate("company", "name isActive subscription.status")
      .populate("department", "name isActive")
      .select("+password");

    if (!user) {
      return next(
        new CustomError("Invalid email or password", 401, "INVALID_CREDENTIALS")
      );
    }

    // Verify password
    if (!(await user.matchPassword(password))) {
      return next(
        new CustomError("Invalid email or password", 401, "INVALID_CREDENTIALS")
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return next(
        new CustomError("User account is deactivated", 401, "USER_DEACTIVATED")
      );
    }

    // Check if company is active
    if (!user.company.isActive) {
      return next(
        new CustomError(
          "Company account is deactivated",
          401,
          "COMPANY_DEACTIVATED"
        )
      );
    }

    // Check company subscription status
    if (user.company.subscription.status !== "active") {
      return next(
        new CustomError(
          "Company subscription is not active",
          403,
          "SUBSCRIPTION_INACTIVE"
        )
      );
    }

    // Check if department is active
    if (!user.department.isActive) {
      return next(
        new CustomError(
          "Department is deactivated",
          401,
          "DEPARTMENT_DEACTIVATED"
        )
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update user's last login
    user.lastLogin = new Date();
    await user.save();

    // Set cookies
    res.cookie("access_token", accessToken, getAccessTokenCookieOptions());
    res.cookie("refresh_token", refreshToken, getRefreshTokenCookieOptions());

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
});

// @desc    Verify user email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) return next(new CustomError("Verification token required", 400));

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: customDayjs().toDate() },
  }).select("+verificationToken +verificationTokenExpiry");

  if (!user) {
    // Cleanup expired token
    await User.deleteOne({ verificationToken: token });
    return next(new CustomError("Invalid/expired token", 400, "TOKEN_INVALID"));
  }

  // Update user status
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  // Generate new access token
  generateAccessToken(res, user);

  // Get updated user data
  const updatedUser = await User.findById(user._id)
    .populate({
      path: "department",
      select: "name description",
      populate: {
        path: "managers",
        select:
          "firstName lastName fullName position email position profilePicture",
      },
    })
    .select("-password -tokenVersion");

  // Emit success event
  emitToUser(user._id, "email-verified", {
    message: "Your email was verified successfully!",
  });

  res.status(200).json({
    success: true,
    user: updatedUser,
    message: "Email verified successfully",
  });
});

//@desc    Logout user and clear cookies
//@route   DELETE /api/auth/logout
//@access  Private
const logoutUser = asyncHandler(async (req, res, next) => {
  try {
    // Clear cookies
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh-token",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    next(error);
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Validate email
  if (!email?.trim()) {
    return next(new CustomError("Email is required", 400));
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Return generic message to prevent email enumeration
    return res.status(200).json({
      success: true,
      message: "If account exists, reset instructions will be sent",
    });
  }

  console.log("here");

  // Check verification status
  if (!user.isVerified) {
    return next(new CustomError("Please verify your email first", 403));
  }

  // Generate and send reset token
  const { token } = user.generatePasswordResetToken();
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await sendResetPasswordEmail(user.email, resetURL);

  res.status(200).json({
    success: true,
    message: "If account exists, reset instructions will be sent",
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  // Validate password
  if (!password?.trim()) {
    return next(new CustomError("Password is required", 400));
  }

  // Find user by valid token
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpiry: { $gt: customDayjs().toDate() },
  });

  if (!user) {
    return next(new CustomError("Invalid/expired token", 400));
  }

  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  user.tokenVersion += 1; // Invalidate existing sessions
  await user.save();

  // Send confirmation email
  await sendRestSuccessEmail(user.email);

  // Create notification
  const notification = new Notification({
    user: user._id,
    type: "SystemAlert",
    message: "Your password was reset successfully",
    linkedDocument: user._id,
    linkedDocumentType: "User",
    department: user.department,
  });

  // Save Notification
  await notification.save();

  // Clear existing cookies
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.status(200).json({
    success: true,
    message: "Password reset successfully. Please login",
  });
});

// @desc    Refresh access token
// @route   GET /api/auth/refresh
// @access  Public
const getRefreshToken = asyncHandler(async (req, res, next) => {
  const currentRefreshToken = req.cookies.refresh_token;

  if (!currentRefreshToken) {
    return next(new CustomError("Unauthorized", 401));
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(currentRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return next(new CustomError("Invalid token", 403));
  }

  // Find user
  const user = await User.findById(decoded._id).select(
    "+tokenVersion +isActive +isVerified"
  );

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Validate token version
  if (user.tokenVersion !== decoded.tokenVersion) {
    return next(new CustomError("Token revoked", 403));
  }

  // Check account status
  if (!user.isActive) {
    return next(new CustomError("Account deactivated", 403));
  }

  // Generate new access token
  generateAccessToken(res, user);

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    return next(new CustomError("Not authorized", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    // Get user data
    const user = await User.findById(decoded._id)
      .select("+isVerified +isActive")
      .populate({
        path: "department",
        select: "name description",
        populate: {
          path: "managers",
          select:
            "firstName lastName fullName position email position profilePicture",
        },
      })
      .select("-password -tokenVersion");

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

    res.status(200).json({
      success: true,
      user,
      message: "User retrieved successfully",
    });
  } catch (error) {
    return next(new CustomError(`Session expired - ${error.message}`, 401));
  }
});

export {
  loginUser,
  verifyEmail,
  logoutUser,
  forgotPassword,
  resetPassword,
  getRefreshToken,
  getMe,
};
