import mongoose from "mongoose";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import Task from "../models/TaskModel.js";
import TaskActivity from "../models/TaskActivityModel.js";
import Notification from "../models/NotificationModel.js";

import { sendVerificationEmail } from "../utils/SendEmail.js";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

// @desc    Create user
// @route   POST /api/users/department/:departmentId
// @access  Private (SuperAdmin, Admin)
const createUser = asyncHandler(async (req, res, next) => {});

// @desc    Get all users
// @route   GET /api/users/department/:departmentId
// @access  Private (SuperAdmin, Admin, Manager)
const getAllUsers = asyncHandler(async (req, res, next) => {});

// @desc    Get user
// @route   GET /api/users/department/:departmentId/user/:userId
// @access  Private, TODO: who can access this endpoint?
const getUserById = asyncHandler(async (req, res, next) => {});

// @desc    Update user
// @route   PUT /api/users/department/:departmentId/user/:userId
// @access  Private (SuperAdmin, Admin)
const updateUserById = asyncHandler(async (req, res, next) => {});

// @desc    Delete user
// @route   DELETE /api/users/department/:departmentId/user/:userId
// @access  Private (SuperAdmin)
const deleteUserById = asyncHandler(async (req, res, next) => {});

export { createUser, getAllUsers, getUserById, updateUserById, deleteUserById };
