import asyncHandler from "express-async-handler";
import crypto from "crypto";
import User from "../models/UserModel.js";
import CustomError from "../errorHandler/CustomError.js";
import dayjs from "dayjs";

import { sendVerificationEmail } from "../utils/SendEmail.js";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

// @desc    Update user's own details (name, position)
// @route   PUT /api/users/:userId/details
// @access  Private (Self)
const updateMyDetails = asyncHandler(async (req, res, next) => {
  if (req.user._id.toString() !== req.params.userId) {
    return next(
      new CustomError("Not authorized to update this user's details", 403)
    );
  }

  const { firstName, lastName, position } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.position = position || user.position;

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } else {
    return next(new CustomError("User not found", 404));
  }
});

// @desc    Change user's own password
// @route   PUT /api/users/:userId/password
// @access  Private (Self)
const changeMyPassword = asyncHandler(async (req, res, next) => {
  if (req.user._id.toString() !== req.params.userId) {
    return next(
      new CustomError("Not authorized to change this user's password", 403)
    );
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(
      new CustomError("Please provide current and new passwords", 400)
    );
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user || !(await user.matchPassword(currentPassword))) {
    return next(new CustomError("Invalid current password", 401));
  }

  try {
    user.password = newPassword;
    user.tokenVersion += 1; // Invalidate all other sessions for security
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
});

// @desc    Initiate an email change request
// @route   POST /api/users/:userId/initiate-email-change
// @access  Private (Self)
const initiateEmailChange = asyncHandler(async (req, res, next) => {
  if (req.user._id.toString() !== req.params.userId) {
    return next(new CustomError("Not authorized", 403));
  }

  const { newEmail, password } = req.body;
  if (!newEmail || !password) {
    return next(
      new CustomError("New email and current password are required", 400)
    );
  }

  // Check if new email is already taken
  const emailExists = await User.findOne({ email: newEmail.toLowerCase() });
  if (emailExists) {
    return next(new CustomError("This email address is already in use", 409));
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    return next(new CustomError("Invalid current password", 401));
  }

  try {
    // Generate verification token first
    const verificationToken = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();
    const verificationTokenExpiry = getFormattedDate(
      dayjs().format("YYYY-MM-DD"),
      15
    );

    user.pendingEmail = newEmail;
    user.emailChangeToken = verificationToken; // Use the same field
    user.emailChangeTokenExpiry = verificationTokenExpiry;

    await user.save();
    await sendVerificationEmail(newEmail, user.emailChangeToken);

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${newEmail}`,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Verify and finalize an email change
// @route   POST /api/users/:userId/verify-email-change
// @access  Private (Self)
const verifyEmailChange = asyncHandler(async (req, res, next) => {
  if (req.user._id.toString() !== req.params.userId) {
    return next(new CustomError("Not authorized", 403));
  }

  const { token } = req.body;
  if (!token) {
    return next(new CustomError("Verification token is required", 400));
  }

  const user = await User.findOne({
    _id: req.user._id,
    emailChangeToken: token,
    emailChangeTokenExpiry: { $gt: dayjs().format("YYYY-MM-DD") },
  });

  if (!user) {
    return next(new CustomError("Invalid or expired verification token", 400));
  }

  try {
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailChangeToken = undefined;
    user.emailChangeTokenExpiry = undefined;

    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// @desc    Update user's own profile picture URL
// @route   PUT /api/users/:userId/profile-picture
// @access  Private (Self)
const updateMyProfilePicture = asyncHandler(async (req, res, next) => {
  if (req.user._id.toString() !== req.params.userId) {
    return next(new CustomError("Not authorized", 403));
  }

  const { url, public_id } = req.body;
  if (!url || !public_id) {
    return next(new CustomError("Image URL and Public ID are required", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePicture: { url, public_id } },
    { new: true }
  );

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  res.status(200).json(user);
});

export {
  updateMyDetails,
  changeMyPassword,
  initiateEmailChange,
  verifyEmailChange,
  updateMyProfilePicture,
};
