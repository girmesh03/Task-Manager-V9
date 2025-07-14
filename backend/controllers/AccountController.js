import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import crypto from "crypto";
import User from "../models/UserModel.js";
import { sendVerificationEmail } from "../utils/SendEmail.js";
import {customDayjs} from "../utils/GetDateIntervals.js";

// @desc    Update user details (SuperAdmin only)
// @route   PUT /api/account/users/:userId/details
// @access  Private (SuperAdmin)
const updateMyDetails = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Verify SuperAdmin authorization
  if (req.user.role !== "SuperAdmin") {
    return next(new CustomError("Not authorized to update user details", 403));
  }

  // Validate user ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new CustomError("Invalid user ID", 400));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Extract allowed fields
  const {
    firstName,
    lastName,
    position,
    department,
    role,
    isActive,
    isVerified,
  } = req.body;

  // Apply updates
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (position) user.position = position;
  if (department) {
    if (!mongoose.Types.ObjectId.isValid(department)) {
      return next(new CustomError("Invalid department ID", 400));
    }
    user.department = department;
  }
  if (role) user.role = role;
  if (typeof isActive === "boolean") user.isActive = isActive;
  if (typeof isVerified === "boolean") user.isVerified = isVerified;

  // Save updated user
  const updatedUser = await user.save();

  // Remove sensitive data before sending response
  const userResponse = updatedUser.toObject();
  delete userResponse.password;
  delete userResponse.tokenVersion;

  res.status(200).json({
    success: true,
    user: userResponse,
    message: "User details updated successfully",
  });
});

// @desc    Change user's own password
// @route   PUT /api/account/password
// @access  Private
const changeMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return next(new CustomError("Current and new passwords are required", 400));
  }

  // Find user with password
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Verify current password
  if (!(await user.matchPassword(currentPassword))) {
    return next(new CustomError("Invalid current password", 401));
  }

  // Update password
  user.password = newPassword;
  user.tokenVersion += 1; // Invalidate existing sessions
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// @desc    Initiate email change (Self only)
// @route   POST /api/account/email-change
// @access  Private
const initiateEmailChange = asyncHandler(async (req, res, next) => {
  const { newEmail, password } = req.body;

  // Validate input
  if (!newEmail || !password) {
    return next(
      new CustomError("New email and current password are required", 400)
    );
  }

  // Verify password
  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return next(new CustomError("Invalid current password", 401));
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
  if (existingUser) {
    return next(new CustomError("Email already in use", 409));
  }

  // Generate verification token
  const token = crypto.randomBytes(3).toString("hex").toUpperCase();
  const expiry = customDayjs().add(15, "minute").toDate();

  // Update user record
  user.pendingEmail = newEmail;
  user.emailChangeToken = token;
  user.emailChangeTokenExpiry = expiry;
  await user.save();

  // Send verification email
  await sendVerificationEmail(newEmail, token);

  res.status(200).json({
    success: true,
    message: `Verification code sent to ${newEmail}`,
  });
});

// @desc    Verify and finalize email change (Self only)
// @route   POST /api/account/email-change/verify
// @access  Private
const verifyEmailChange = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  // Validate input
  if (!token) {
    return next(new CustomError("Verification token is required", 400));
  }

  // Find user by valid token
  const user = await User.findOne({
    _id: req.user._id,
    emailChangeToken: token,
    emailChangeTokenExpiry: { $gt: customDayjs().toDate() },
  });

  if (!user) {
    return next(new CustomError("Invalid or expired token", 400));
  }

  // Update email
  user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  user.emailChangeToken = undefined;
  user.emailChangeTokenExpiry = undefined;
  user.tokenVersion += 1; // Invalidate existing sessions

  const updatedUser = await user.save();

  // Remove sensitive data before sending response
  const userResponse = updatedUser.toObject();
  delete userResponse.password;
  delete userResponse.tokenVersion;

  res.status(200).json({
    success: true,
    user: userResponse,
    message: "Email updated successfully",
  });
});

// @desc    Update user's own profile picture
// @route   PUT /api/account/profile-picture
// @access  Private
const updateMyProfilePicture = asyncHandler(async (req, res, next) => {
  const { url, public_id } = req.body;

  // Validate input
  if (!url || !public_id) {
    return next(new CustomError("Image URL and public ID are required", 400));
  }

  // Update profile picture
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePicture: { url, public_id } },
    { new: true }
  ).select("-password -tokenVersion");

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
    message: "Profile picture updated successfully",
  });
});

export {
  updateMyDetails,
  changeMyPassword,
  initiateEmailChange,
  verifyEmailChange,
  updateMyProfilePicture,
};
