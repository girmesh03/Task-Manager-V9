import asyncHandler from "express-async-handler";
import dayjs from "dayjs";
import CustomError from "../errorHandler/CustomError.js";
import Notification from "../models/NotificationModel.js";

import { emitToUser } from "../utils/SocketEmitter.js";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

// @desc    Get user notifications stats (unread count)
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = asyncHandler(async (req, res, next) => {
  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    unreadCount,
    message: "Unread notifications count retrieved successfully.",
  });
});

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, unread } = req.query;

  const filter = { user: req.user._id };
  if (unread === "true") filter.isRead = false;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: {
      path: "linkedDocument",
      select: "title description status", // Populate necessary fields for navigation
    },
  };

  const results = await Notification.paginate(filter, options);

  res.status(200).json({
    success: true,
    notifications: results.docs,
    pagination: {
      page: results.page,
      limit: results.limit,
      total: results.totalDocs,
      totalPages: results.totalPages,
      hasNextPage: results.hasNextPage,
      hasPrevPage: results.hasPrevPage,
    },
    message: "Notifications retrieved successfully.",
  });
});

// @desc    Mark notifications as read
// @route   PATCH /api/notifications/read
// @access  Private
const markAsRead = asyncHandler(async (req, res, next) => {
  const { notificationIds } = req.body;

  if (
    !notificationIds ||
    !Array.isArray(notificationIds) ||
    notificationIds.length === 0
  ) {
    return next(new CustomError("Invalid notification IDs", 400));
  }

  await Notification.updateMany(
    { _id: { $in: notificationIds }, user: req.user._id },
    { $set: { isRead: true } }
  );

  emitToUser(req.user._id, "notifications-read", { notificationIds });

  res.status(200).json({
    success: true,
    message: "Notifications marked as read.",
  });
});

// @desc    Mark all user notifications as read
// @route   POST /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  emitToUser(req.user._id, "notifications-all-read", {});

  res.status(200).json({
    success: true,
    message: "All notifications marked as read.",
  });
});

// @desc    Clear old notifications
// @route   DELETE /api/notifications/clear
// @access  Private
const clearNotifications = asyncHandler(async (req, res, next) => {
  const thirtyDaysAgo = getFormattedDate(
    dayjs().subtract(30, "days"),
    "YYYY-MM-DD"
  );

  // Delete all notifications older than 30 days
  await Notification.deleteMany({
    user: req.user._id,
    createdAt: { $gt: thirtyDaysAgo },
  });

  res.status(200).json({
    success: true,
    message: "Old notifications cleared.",
  });
});

export {
  getNotificationStats,
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
};
