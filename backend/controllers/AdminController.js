import asyncHandler from "express-async-handler";

// Import the new aggregation functions
import {
  fetchAllDepartmentsAggregated,
  fetchAllUsersAggregated,
} from "../pipelines/admin.js";

// @desc    Get All Departments for Admin DataGrid
// @route   GET /api/admin/departments
// @access  Private (SuperAdmin)
const getAllDepartments = asyncHandler(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = Number(page);
  limit = Number(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100; // Max limit

  try {
    const result = await fetchAllDepartmentsAggregated({ page, limit });

    const departments = result.rows.map((dept) => ({
      ...dept,
      id: dept._id.toString(), // Add 'id' field for MUI DataGrid
    }));

    res.status(200).json({
      rows: departments,
      page,
      pageSize: limit,
      rowCount: result.rowCount || 0,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get All Users for Admin DataGrid
// @route   GET /api/admin/users
// @access  Private (SuperAdmin)
const getAllUsers = asyncHandler(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = Number(page);
  limit = Number(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100; // Max limit

  try {
    const result = await fetchAllUsersAggregated({ page, limit });

    const users = result.rows.map((user) => ({
      ...user,
      id: user._id.toString(), // Add 'id' field for MUI DataGrid
    }));

    res.status(200).json({
      rows: users,
      page,
      pageSize: limit,
      rowCount: result.rowCount || 0,
    });
  } catch (error) {
    next(error);
  }
});

export { getAllDepartments, getAllUsers };
