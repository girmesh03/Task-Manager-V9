import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import Notification from "../models/NotificationModel.js";

// @desc    Create Department
// @route   POST /api/departments
// @access  Private (SuperAdmin, Admin)
const createDepartment = asyncHandler(async (req, res, next) => {});

// @desc    Get departments
// @route   GET /api/departments?page=1&limit=10
// @access  Private (SuperAdmin, Admin, Manager, User)
const getAllDepartments = asyncHandler(async (req, res, next) => {});

// @desc    Get department by departmentId
// @route   GET /api/departments/:departmentId
// @access  Private
const getDepartmentById = asyncHandler(async (req, res, next) => {});

// @desc    Update Department
// @route   PUT /api/departments/:departmentId
// @access  Private (SuperAdmin, Admin)
const updateDepartmentById = asyncHandler(async (req, res, next) => {});

// @desc    Delete Department and all associated data
// @route   DELETE /api/departments/:departmentId
// @access  Private (SuperAdmin, Admin)
const deleteDepartmentById = asyncHandler(async (req, res, next) => {});

export {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartmentById,
  deleteDepartmentById,
};
