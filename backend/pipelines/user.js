import mongoose from "mongoose";
import User from "../models/UserModel.js"; // Adjust path as needed

const ACTIVITY_PER_TASK_BENCHMARK = 5;
const TOTAL_TASK_VOLUME_BENCHMARK = 20;

export const getUserTaskStatisticsForChartPipeline = ({
  currentStartDate,
  currentEndDate,
  dateRange,
  departmentId,
  userId = null,
}) => {
  return [
    // Initial match - AssignedTasks only
    {
      $match: {
        department: departmentId,
        createdAt: { $gte: currentStartDate, $lte: currentEndDate },
        taskType: "AssignedTask",
        ...(userId && { assignedTo: { $in: [userId] } }),
      },
    },
    // Format date to YYYY-MM-DD string
    {
      $addFields: {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      },
    },
    // Group by day and status
    {
      $group: {
        _id: {
          day: "$day",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    // Group by status to collect daily counts
    {
      $group: {
        _id: "$_id.status",
        dailyCounts: {
          $push: {
            day: "$_id.day",
            count: "$count",
          },
        },
      },
    },
    // Create data arrays for each status
    {
      $project: {
        _id: 0,
        status: "$_id",
        data: {
          $map: {
            input: dateRange,
            as: "date",
            in: {
              $let: {
                vars: {
                  match: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$dailyCounts",
                          as: "dayData",
                          cond: { $eq: ["$$dayData.day", "$$date"] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: { $ifNull: ["$$match.count", 0] },
              },
            },
          },
        },
      },
    },
    // Group all statuses into one document
    {
      $group: {
        _id: null,
        statusData: { $push: "$$ROOT" },
      },
    },
    // Project into final format
    {
      $project: {
        _id: 0,
        assignedSeries: {
          $map: {
            input: [
              { id: "completed", status: "Completed", label: "Completed" },
              {
                id: "in-progress",
                status: "In Progress",
                label: "In Progress",
              },
              { id: "pending", status: "Pending", label: "Pending" },
              { id: "to-do", status: "To Do", label: "To Do" },
            ],
            as: "statusConfig",
            in: {
              $let: {
                vars: {
                  statusMatch: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$statusData",
                          as: "sd",
                          cond: {
                            $eq: ["$$sd.status", "$$statusConfig.status"],
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: {
                  id: "$$statusConfig.id",
                  label: "$$statusConfig.label",
                  data: {
                    $ifNull: ["$$statusMatch.data", []],
                  },
                },
              },
            },
          },
        },
      },
    },
  ];
};

export const getUserRoutineTaskStatisticsForChartPipeline = ({
  currentStartDate,
  currentEndDate,
  dateRange,
  departmentId,
  userId = null,
}) => {
  return [
    // Initial match - RoutineTasks only
    {
      $match: {
        department: departmentId,
        date: { $gte: currentStartDate, $lte: currentEndDate },
        ...(userId && { performedBy: userId }),
      },
    },
    // Unwind performedTasks array to access individual tasks
    { $unwind: "$performedTasks" },
    // Filter only completed tasks
    {
      $match: {
        "performedTasks.isCompleted": true,
      },
    },
    // Format date to YYYY-MM-DD string
    {
      $addFields: {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
      },
    },
    // Group by day to count completed tasks
    {
      $group: {
        _id: "$day",
        count: { $sum: 1 },
      },
    },
    // Create a single document with all daily counts
    {
      $group: {
        _id: null,
        dailyCounts: {
          $push: {
            day: "$_id",
            count: "$count",
          },
        },
      },
    },
    // Create data array for completed tasks
    {
      $project: {
        _id: 0,
        completedData: {
          $map: {
            input: dateRange,
            as: "date",
            in: {
              $let: {
                vars: {
                  match: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$dailyCounts",
                          as: "dayData",
                          cond: { $eq: ["$$dayData.day", "$$date"] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: { $ifNull: ["$$match.count", 0] },
              },
            },
          },
        },
      },
    },
    // Project into final format
    {
      $project: {
        routineSeries: [
          {
            id: "completed",
            label: "Completed",
            data: "$completedData",
          },
          {
            id: "in-progress",
            label: "In Progress",
            // data: { $map: { input: dateRange, as: "d", in: 0 } },
            data: [],
          },
          {
            id: "pending",
            label: "Pending",
            // data: { $map: { input: dateRange, as: "d", in: 0 } },
            data: [],
          },
          {
            id: "to-do",
            label: "To Do",
            // data: { $map: { input: dateRange, as: "d", in: 0 } },
            data: [],
          },
        ],
      },
    },
  ];
};

export async function fetchUserStatistics({
  departmentId,
  userPerformingActionRole,
  startDate,
  endDate,
  page,
  limit,
}) {
  const skip = (page - 1) * limit;

  const aggregationPipeline = [
    // 1. Initial Match for Users
    {
      $match: {
        department: departmentId,
        isActive: true,
      },
    },
    // 2. Lookups (Assigned, Project, Routine Tasks, Activities, Department)
    {
      $lookup: {
        from: "tasks",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$$userId", "$assignedTo"] },
              taskType: "AssignedTask",
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
        ],
        as: "assignedTasksData",
      },
    },
    {
      $lookup: {
        from: "tasks",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$createdBy", "$$userId"] },
              taskType: "ProjectTask",
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
        ],
        as: "projectTasksData",
      },
    },
    {
      $lookup: {
        from: "routinetasks",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$performedBy", "$$userId"] },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
        ],
        as: "routineTasksData",
      },
    },
    {
      $lookup: {
        from: "taskactivities",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$performedBy", "$$userId"] },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
        ],
        as: "activitiesData",
      },
    },
    {
      $lookup: {
        from: "departments",
        localField: "department",
        foreignField: "_id",
        as: "departmentInfo",
      },
    },
    {
      $unwind: {
        path: "$departmentInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    // 7. AddFields - Calculate Counts and Metrics
    {
      $addFields: {
        _projectTasksToConsider: {
          $cond: {
            if: { $eq: [userPerformingActionRole, "User"] },
            then: [],
            else: "$projectTasksData",
          },
        },
      },
    },
    {
      $addFields: {
        name: { $concat: ["$firstName", " ", "$lastName"] },
        departmentName: "$departmentInfo.name",
        assignedTaskCount: { $size: "$assignedTasksData" },
        projectTaskCount: { $size: "$_projectTasksToConsider" },
        routineTaskCount: { $size: "$routineTasksData" },
        activityCount: { $size: "$activitiesData" },
        _allRelevantTasksForStatusPriority: {
          $concatArrays: ["$assignedTasksData", "$_projectTasksToConsider"],
        },
      },
    },
    {
      $addFields: {
        completedTaskCount: {
          $size: {
            $filter: {
              input: "$_allRelevantTasksForStatusPriority",
              as: "task",
              cond: { $eq: ["$$task.status", "Completed"] },
            },
          },
        },
        pendingTaskCount: {
          $size: {
            $filter: {
              input: "$_allRelevantTasksForStatusPriority",
              as: "task",
              cond: { $eq: ["$$task.status", "Pending"] },
            },
          },
        },
        highPriorityCount: {
          $size: {
            $filter: {
              input: "$_allRelevantTasksForStatusPriority",
              as: "task",
              cond: { $eq: ["$$task.priority", "High"] },
            },
          },
        },
        mediumPriorityCount: {
          $size: {
            $filter: {
              input: "$_allRelevantTasksForStatusPriority",
              as: "task",
              cond: { $eq: ["$$task.priority", "Medium"] },
            },
          },
        },
        lowPriorityCount: {
          $size: {
            $filter: {
              input: "$_allRelevantTasksForStatusPriority",
              as: "task",
              cond: { $eq: ["$$task.priority", "Low"] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        totalTaskCount: {
          $add: [
            "$assignedTaskCount",
            "$projectTaskCount",
            "$routineTaskCount",
          ],
        },
      },
    },

    // ---- RATING CALCULATION STAGES ----
    {
      $addFields: {
        _nonRoutineTaskCountForRating: {
          $add: ["$assignedTaskCount", "$projectTaskCount"],
        },
      },
    },
    {
      $addFields: {
        _completionScore: {
          // Score 0-1
          $cond: {
            if: { $gt: ["$_nonRoutineTaskCountForRating", 0] },
            then: {
              $divide: [
                "$completedTaskCount",
                "$_nonRoutineTaskCountForRating",
              ],
            },
            else: 0,
          },
        },
        _expectedMaxActivityForRating: {
          $multiply: [
            "$_nonRoutineTaskCountForRating",
            ACTIVITY_PER_TASK_BENCHMARK,
          ],
        },
      },
    },
    {
      $addFields: {
        _activityScoreNormalized: {
          // Score 0-1
          $cond: {
            if: { $gt: ["$_expectedMaxActivityForRating", 0] },
            then: {
              $min: [
                1,
                {
                  $divide: ["$activityCount", "$_expectedMaxActivityForRating"],
                },
              ],
            },
            else: 0, // No non-routine tasks to log activity against, or no activity
          },
        },
        _volumeScoreNormalized: {
          // Score 0-1
          $cond: {
            // Avoid division by zero if benchmark is 0, though it's a const > 0 here
            if: { $gt: [TOTAL_TASK_VOLUME_BENCHMARK, 0] },
            then: {
              $min: [
                1,
                { $divide: ["$totalTaskCount", TOTAL_TASK_VOLUME_BENCHMARK] },
              ],
            },
            else: 0,
          },
        },
      },
    },
    {
      $addFields: {
        _rawRating: {
          // Weighted score 0-1
          $add: [
            { $multiply: ["$_completionScore", 0.5] }, // 50% weight
            { $multiply: ["$_activityScoreNormalized", 0.3] }, // 30% weight
            { $multiply: ["$_volumeScoreNormalized", 0.2] }, // 20% weight
          ],
        },
      },
    },
    {
      $addFields: {
        rating: {
          // Final rating 1-5, rounded to 1 decimal
          $round: [{ $add: [1, { $multiply: ["$_rawRating", 4] }] }, 1],
        },
      },
    },
    // ---- END OF RATING CALCULATION ----

    // Project final fields
    {
      $project: {
        _id: 1,
        // fullName: "$name",
        name: 1,
        email: 1,
        userRole: "$role",
        departmentName: 1,
        assignedTaskCount: 1,
        projectTaskCount: 1,
        routineTaskCount: 1,
        totalTaskCount: 1,
        activityCount: 1,
        completedTaskCount: 1,
        pendingTaskCount: 1,
        highPriorityCount: 1,
        mediumPriorityCount: 1,
        lowPriorityCount: 1,
        rating: 1, // Include the new rating
        // Temporary fields for rating calculation are implicitly excluded
      },
    },
    // 8. Sort Results (can sort by rating now if desired)
    {
      $sort: { rating: -1, totalTaskCount: -1, name: 1 },
    },
    // 9. Pagination using $facet
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
    // 10. Transform Facet Result
    {
      $project: {
        rows: "$paginatedResults",
        rowCount: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
      },
    },
  ];

  const results = await User.aggregate(aggregationPipeline).exec();
  return results[0] || { rows: [], rowCount: 0 };
}
