import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import Department from "../models/DepartmentModel.js";
import Task from "../models/TaskModel.js";

import {
  getSixMonthStatsPipeline,
  getDepartmentPerformancePipeline,
  getTaskStatisticsPipeline,
} from "../pipelines/Dashboard.js";

import { getDateIntervals } from "../utils/GetDateIntervals.js";

// Helper function to generate statistics output
const generateTaskStatsOutput = (stats, statuses, interval) => {
  // Create a map for quick lookup by status
  const statsMap = new Map();
  stats.forEach((stat) => {
    statsMap.set(stat.status, stat);
  });

  // Generate output array for all required statuses
  return statuses.map((status) => {
    const stat = statsMap.get(status);
    return {
      status,
      current30DaysCount: stat?.last30DaysCount || 0,
      previous30DaysCount: stat?.previous30DaysCount || 0,
      interval,
      trend: stat?.trend || "neutral",
      trendChange: stat?.trendChange || 0,
      data: stat?.data || Array(30).fill(0),
    };
  });
};

// @desc    Get dashboard statistics
// @route   GET /api/statistics/department/:departmentId/dashboard?currentDate
// @access  Private (Handled by middleware)
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const { currentDate } = req.query;

  // Get Department
  const department = await Department.findById(departmentId);
  if (!department) {
    return next(new CustomError("Department not found", 404));
  }

  // Get date intervals
  const dates = getDateIntervals(currentDate);
  if (!dates) return next(new CustomError("Invalid date format", 400));

  const weights = {
    AssignedTask: parseFloat(req.query.assignedWeight) || 1.0,
    ProjectTask: parseFloat(req.query.projectWeight) || 1.5,
    RoutineTask: parseFloat(req.query.routineWeight) || 0.8,
  };

  const {
    last30DaysStart,
    last30DaysEnd: today,
    previous30DaysStart,
    previous30DaysEnd,
    daysInLast30,
    dateRange,
    sixMonthsAgo,
    lastSixMonths,
    sixMonthRange,
  } = dates;

  try {
    // Last 30 days Task Statistics for Assigned, Project, Routine tasks
    const getTaskStatistics = await Task.aggregate(
      getTaskStatisticsPipeline({
        currentEndDate: today,
        currentStartDate: last30DaysStart,
        previousStartDate: previous30DaysStart,
        previousEndDate: previous30DaysEnd,
        dateRange: dateRange,
        departmentId: department._id,
      })
    );

    // Prepare interval
    const interval = `${daysInLast30[0]} - ${
      daysInLast30[daysInLast30.length - 1]
    }`;

    // Format task statistics
    const formattedTaskStats = generateTaskStatsOutput(
      getTaskStatistics,
      ["Completed", "In Progress", "Pending", "To Do"],
      interval
    );

    // Get six month statistics for barchart
    const [sixMonthStats] = await Task.aggregate(
      getSixMonthStatsPipeline({
        sixMonthsAgo,
        today,
        departmentId: department._id,
        monthRange: sixMonthRange,
      })
    );

    if (sixMonthStats) {
      sixMonthStats.lastSixMonths = lastSixMonths;
      sixMonthStats.interval = interval;
    }

    // Default six month data series for barchart
    const defaultSeries = {
      Completed: new Array(6).fill(0),
      "In Progress": new Array(6).fill(0),
      Pending: new Array(6).fill(0),
      "To Do": new Array(6).fill(0),
    };

    const [departmentPerformance] = await Task.aggregate(
      getDepartmentPerformancePipeline({
        departmentId: department._id,
        currentEndDate: today,
        currentStartDate: last30DaysStart,
        weights,
      })
    );

    // Add alert threshold check
    if (departmentPerformance) {
      departmentPerformance.alert =
        departmentPerformance.performanceScore < 70
          ? "Critical"
          : departmentPerformance.performanceScore < 85
          ? "Warning"
          : "Good";
      departmentPerformance.interval = interval;
    }

    // Return response
    res.status(200).json({
      taskStatistics: formattedTaskStats,
      sixMonthStatistics: sixMonthStats || {
        sixMonthSeries: defaultSeries,
        lastSixMonths,
        interval,
      },
      // leaderboardStatistics: leaderboardStats,
      daysInLast30,
      performanceChartData: departmentPerformance || {
        totalTasks: 0,
        completedTasks: 0,
        incompleteTasks: 0,
        performanceScore: 0,
        breakdown: [],
        alert: "No Data",
        interval,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { getDashboardStats };
