// Task Statistics Pipeline for Assigned Tasks
export const getAssignedTaskStatisticsPipeline = ({
  currentStartDate,
  currentEndDate,
  previousStartDate,
  previousEndDate,
  dateRange,
  departmentId,
  userId = null,
}) => {
  return [
    {
      $match: {
        department: departmentId,
        createdAt: { $gte: currentStartDate, $lte: currentEndDate },
        taskType: "AssignedTask",
        ...(userId && { assignedTo: { $in: [userId] } }),
      },
    },
    {
      $addFields: {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      },
    },
    {
      $group: {
        _id: {
          status: "$status",
          day: "$day",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.status",
        dailyCounts: {
          $push: {
            day: "$_id.day",
            count: "$count",
          },
        },
        last30DaysCount: { $sum: "$count" },
      },
    },
    {
      $lookup: {
        from: "tasks",
        let: { status: "$_id" },
        pipeline: [
          {
            $match: {
              department: departmentId,
              createdAt: { $gte: previousStartDate, $lte: previousEndDate },
              taskType: "AssignedTask",
              ...(userId && {
                assignedTo: { $in: [userId] },
              }),
              $expr: {
                $eq: ["$status", "$$status"],
              },
            },
          },
          {
            $group: {
              _id: null,
              previousCount: { $sum: 1 },
            },
          },
        ],
        as: "previousData",
      },
    },
    {
      $addFields: {
        previous30DaysCount: {
          $ifNull: [{ $arrayElemAt: ["$previousData.previousCount", 0] }, 0],
        },
      },
    },
    {
      $addFields: {
        trend: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$_id", "Completed"] },
                then: {
                  $cond: {
                    if: { $gte: ["$last30DaysCount", "$previous30DaysCount"] },
                    then: "up",
                    else: {
                      $cond: {
                        if: {
                          $lt: ["$last30DaysCount", "$previous30DaysCount"],
                        },
                        then: "down",
                        else: "neutral",
                      },
                    },
                  },
                },
              },
              {
                case: { $in: ["$_id", ["Pending", "In Progress", "To Do"]] },
                then: {
                  $cond: {
                    if: { $lt: ["$last30DaysCount", "$previous30DaysCount"] },
                    then: "up",
                    else: {
                      $cond: {
                        if: {
                          $gt: ["$last30DaysCount", "$previous30DaysCount"],
                        },
                        then: "down",
                        else: "neutral",
                      },
                    },
                  },
                },
              },
            ],
            default: "neutral",
          },
        },
        trendChange: {
          $cond: {
            if: { $eq: ["$previous30DaysCount", 0] },
            then: {
              $cond: {
                if: { $eq: ["$last30DaysCount", 0] },
                then: 0,
                else: {
                  $cond: {
                    if: { $eq: ["$_id", "Completed"] },
                    then: 100,
                    else: -100,
                  },
                },
              },
            },
            else: {
              $let: {
                vars: {
                  rawChange: {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$last30DaysCount",
                              "$previous30DaysCount",
                            ],
                          },
                          "$previous30DaysCount",
                        ],
                      },
                      100,
                    ],
                  },
                },
                in: {
                  $cond: {
                    if: { $eq: ["$_id", "Completed"] },
                    then: "$$rawChange",
                    else: { $multiply: ["$$rawChange", -1] },
                  },
                },
              },
            },
          },
        },
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
    {
      $project: {
        _id: 0,
        status: "$_id",
        last30DaysCount: 1,
        previous30DaysCount: 1,
        trend: 1,
        trendChange: 1,
        data: 1,
      },
    },
  ];
};

// Task Statistics Pipeline for Routine Tasks
export const getRoutineTaskStatisticsPipeline = ({
  currentStartDate,
  currentEndDate,
  previousStartDate,
  previousEndDate,
  dateRange,
  departmentId,
  userId = null,
}) => {
  return [
    // Process current period
    {
      $match: {
        department: departmentId,
        date: { $gte: currentStartDate, $lte: currentEndDate },
        ...(userId && { performedBy: userId }),
      },
    },
    { $unwind: "$performedTasks" },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          isCompleted: "$performedTasks.isCompleted",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        completed: {
          $sum: {
            $cond: [{ $eq: ["$_id.isCompleted", true] }, "$count", 0],
          },
        },
        total: { $sum: "$count" },
      },
    },
    {
      $group: {
        _id: null,
        dailyCounts: {
          $push: {
            day: "$_id",
            completed: "$completed",
            total: "$total",
          },
        },
        currentCompleted: { $sum: "$completed" },
      },
    },
    // Process previous period
    {
      $lookup: {
        from: "routinetasks",
        let: {},
        pipeline: [
          {
            $match: {
              department: departmentId,
              date: { $gte: previousStartDate, $lte: previousEndDate },
              ...(userId && {
                performedBy: userId,
              }),
            },
          },
          { $unwind: "$performedTasks" },
          {
            $match: { "performedTasks.isCompleted": true },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ],
        as: "previousData",
      },
    },
    {
      $addFields: {
        previousCompleted: {
          $ifNull: [{ $arrayElemAt: ["$previousData.count", 0] }, 0],
        },
      },
    },
    // Calculate statistics
    {
      $addFields: {
        status: "Completed",
        trend: {
          $cond: {
            if: { $gt: ["$currentCompleted", "$previousCompleted"] },
            then: "up",
            else: {
              $cond: {
                if: { $lt: ["$currentCompleted", "$previousCompleted"] },
                then: "down",
                else: "neutral",
              },
            },
          },
        },
        trendChange: {
          $cond: {
            if: { $eq: ["$previousCompleted", 0] },
            then: {
              $cond: {
                if: { $eq: ["$currentCompleted", 0] },
                then: 0,
                else: 100,
              },
            },
            else: {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ["$currentCompleted", "$previousCompleted"] },
                    "$previousCompleted",
                  ],
                },
                100,
              ],
            },
          },
        },
        // Generate daily data array (only completed tasks)
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
                in: { $ifNull: ["$$match.completed", 0] },
              },
            },
          },
        },
      },
    },
    // Project final fields
    {
      $project: {
        _id: 0,
        status: 1,
        last30DaysCount: "$currentCompleted",
        previous30DaysCount: "$previousCompleted",
        trend: 1,
        trendChange: 1,
        data: 1,
      },
    },
  ];
};

// Task Statistics Pipeline for Assigned, Project, Routine Tasks
export const getTaskStatisticsPipeline = ({
  currentStartDate,
  currentEndDate,
  previousStartDate,
  previousEndDate,
  dateRange,
  departmentId,
  userId = null,
}) => {
  return [
    // Stage 1: Process current period tasks
    {
      $match: {
        department: departmentId,
        createdAt: { $gte: currentStartDate, $lte: currentEndDate },
        ...(userId && {
          $or: [
            { taskType: "AssignedTask", assignedTo: { $in: [userId] } },
            { taskType: "ProjectTask", createdBy: userId },
          ],
        }),
      },
    },
    {
      $project: {
        status: 1,
        day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      },
    },
    // Stage 2: Process current period routine tasks
    {
      $unionWith: {
        coll: "routinetasks",
        pipeline: [
          {
            $match: {
              department: departmentId,
              date: { $gte: currentStartDate, $lte: currentEndDate },
              ...(userId && { performedBy: userId }),
            },
          },
          { $unwind: "$performedTasks" },
          {
            $project: {
              status: {
                $cond: {
                  if: "$performedTasks.isCompleted",
                  then: "Completed",
                  else: "To Do",
                },
              },
              day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            },
          },
        ],
      },
    },
    // Stage 3: Group by status and day
    {
      $group: {
        _id: {
          status: "$status",
          day: "$day",
        },
        count: { $sum: 1 },
      },
    },
    // Stage 4: Group by status for totals
    {
      $group: {
        _id: "$_id.status",
        dailyCounts: {
          $push: {
            day: "$_id.day",
            count: "$count",
          },
        },
        last30DaysCount: { $sum: "$count" },
      },
    },
    // Stage 5: Lookup previous period tasks
    {
      $lookup: {
        from: "tasks",
        let: { status: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$department", departmentId] },
                  { $gte: ["$createdAt", previousStartDate] },
                  { $lte: ["$createdAt", previousEndDate] },
                  { $eq: ["$status", "$$status"] },
                  ...(userId
                    ? [
                        {
                          $or: [
                            {
                              $and: [
                                { $eq: ["$taskType", "AssignedTask"] },
                                { $in: [userId, "$assignedTo"] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ["$taskType", "ProjectTask"] },
                                { $eq: ["$createdBy", userId] },
                              ],
                            },
                          ],
                        },
                      ]
                    : []),
                ],
              },
            },
          },
          { $count: "count" },
        ],
        as: "prevTasks",
      },
    },
    // Stage 6: Lookup previous period routine tasks
    {
      $lookup: {
        from: "routinetasks",
        let: { status: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$department", departmentId] },
                  { $gte: ["$date", previousStartDate] },
                  { $lte: ["$date", previousEndDate] },
                  ...(userId ? [{ $eq: ["$performedBy", userId] }] : []),
                ],
              },
            },
          },
          { $unwind: "$performedTasks" },
          {
            $match: {
              $expr: {
                $eq: [
                  {
                    $cond: [
                      "$performedTasks.isCompleted",
                      "Completed",
                      "To Do",
                    ],
                  },
                  "$$status",
                ],
              },
            },
          },
          { $count: "count" },
        ],
        as: "prevRoutine",
      },
    },
    // Stage 7: Combine previous counts
    {
      $addFields: {
        prevTasksCount: {
          $ifNull: [{ $arrayElemAt: ["$prevTasks.count", 0] }, 0],
        },
        prevRoutineCount: {
          $ifNull: [{ $arrayElemAt: ["$prevRoutine.count", 0] }, 0],
        },
      },
    },
    {
      $addFields: {
        previous30DaysCount: { $add: ["$prevTasksCount", "$prevRoutineCount"] },
      },
    },
    // Stage 8: Calculate trend
    {
      $addFields: {
        trend: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$_id", "Completed"] },
                then: {
                  $cond: {
                    if: { $gte: ["$last30DaysCount", "$previous30DaysCount"] },
                    then: "up",
                    else: "down",
                  },
                },
              },
              {
                case: { $in: ["$_id", ["Pending", "In Progress", "To Do"]] },
                then: {
                  $cond: {
                    if: { $lt: ["$last30DaysCount", "$previous30DaysCount"] },
                    then: "up",
                    else: {
                      $cond: {
                        if: {
                          $gt: ["$last30DaysCount", "$previous30DaysCount"],
                        },
                        then: "down",
                        else: "neutral",
                      },
                    },
                  },
                },
              },
            ],
            default: "neutral",
          },
        },
        trendChange: {
          $cond: {
            if: { $eq: ["$previous30DaysCount", 0] },
            then: {
              $cond: {
                if: { $eq: ["$last30DaysCount", 0] },
                then: 0,
                else: {
                  $cond: {
                    if: { $eq: ["$_id", "Completed"] },
                    then: 100,
                    else: -100,
                  },
                },
              },
            },
            else: {
              $let: {
                vars: {
                  rawChange: {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$last30DaysCount",
                              "$previous30DaysCount",
                            ],
                          },
                          "$previous30DaysCount",
                        ],
                      },
                      100,
                    ],
                  },
                },
                in: {
                  $cond: {
                    if: { $eq: ["$_id", "Completed"] },
                    then: "$$rawChange",
                    else: { $multiply: ["$$rawChange", -1] },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Stage 9: Map daily data to date range
    {
      $addFields: {
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
    // Stage 10: Project final output
    {
      $project: {
        _id: 0,
        status: "$_id",
        last30DaysCount: 1,
        previous30DaysCount: 1,
        trend: 1,
        trendChange: 1,
        data: 1,
        // Include for debugging:
        prevTasksCount: 1,
        prevRoutineCount: 1,
      },
    },
  ];
};

// Pipeline for 6 month stats
export const getSixMonthStatsPipeline = ({
  sixMonthsAgo,
  today,
  departmentId,
  monthRange, // Array of 6 month strings in "YYYY-MM" format (oldest first)
}) => {
  return [
    // Process Task collection (AssignedTask + ProjectTask)
    {
      $match: {
        department: departmentId,
        createdAt: { $gte: sixMonthsAgo, $lte: today },
      },
    },
    {
      $project: {
        month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        status: 1,
      },
    },
    // Process RoutineTask collection
    {
      $unionWith: {
        coll: "routinetasks",
        pipeline: [
          {
            $match: {
              department: departmentId,
              date: { $gte: sixMonthsAgo, $lte: today },
            },
          },
          { $unwind: "$performedTasks" },
          {
            $project: {
              month: { $dateToString: { format: "%Y-%m", date: "$date" } },
              status: {
                $cond: [
                  { $eq: ["$performedTasks.isCompleted", true] },
                  "Completed",
                  "To Do",
                ],
              },
            },
          },
        ],
      },
    },
    // Categorize all tasks
    {
      $facet: {
        // Completed tasks
        completed: [
          { $match: { status: "Completed" } },
          {
            $group: {
              _id: "$month",
              count: { $sum: 1 },
            },
          },
        ],
        // In Progress tasks
        inProgress: [
          { $match: { status: "In Progress" } },
          {
            $group: {
              _id: "$month",
              count: { $sum: 1 },
            },
          },
        ],
        // Pending tasks
        pending: [
          { $match: { status: "Pending" } },
          {
            $group: {
              _id: "$month",
              count: { $sum: 1 },
            },
          },
        ],
        // To Do tasks
        toDo: [
          { $match: { status: "To Do" } },
          {
            $group: {
              _id: "$month",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
    // Create arrays for each status
    {
      $project: {
        completedArray: {
          $map: {
            input: monthRange,
            as: "m",
            in: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$completed",
                        as: "c",
                        cond: { $eq: ["$$c._id", "$$m"] },
                      },
                    },
                    0,
                  ],
                },
                { count: 0 },
              ],
            },
          },
        },
        inProgressArray: {
          $map: {
            input: monthRange,
            as: "m",
            in: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$inProgress",
                        as: "c",
                        cond: { $eq: ["$$c._id", "$$m"] },
                      },
                    },
                    0,
                  ],
                },
                { count: 0 },
              ],
            },
          },
        },
        pendingArray: {
          $map: {
            input: monthRange,
            as: "m",
            in: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$pending",
                        as: "c",
                        cond: { $eq: ["$$c._id", "$$m"] },
                      },
                    },
                    0,
                  ],
                },
                { count: 0 },
              ],
            },
          },
        },
        toDoArray: {
          $map: {
            input: monthRange,
            as: "m",
            in: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$toDo",
                        as: "c",
                        cond: { $eq: ["$$c._id", "$$m"] },
                      },
                    },
                    0,
                  ],
                },
                { count: 0 },
              ],
            },
          },
        },
      },
    },
    // Format final output
    {
      $project: {
        sixMonthSeries: {
          Completed: "$completedArray.count",
          "In Progress": "$inProgressArray.count",
          Pending: "$pendingArray.count",
          "To Do": "$toDoArray.count",
        },
      },
    },
  ];
};

// Leaderboard pipeline for leaderboard
export const getLeaderboardPipeline = ({
  currentStartDate,
  currentEndDate,
  departmentId,
  limit,
  userId = null,
}) => {
  const leaderboardPipeline = [
    // Get users - conditionally filter by userId if provided
    {
      $match: {
        ...(userId ? { _id: userId } : {}),
        department: departmentId,
        role: "User",
        isActive: true,
      },
    },
    // Add virtual fullName field
    {
      $addFields: {
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
      },
    },
    // Lookup assigned tasks
    {
      $lookup: {
        from: "tasks",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              taskType: "AssignedTask",
              status: "Completed",
              createdAt: { $gte: currentStartDate, $lte: currentEndDate },
              // ...(userId && { assignedTo: { $in: [userId] } }),
            },
          },
          { $unwind: "$assignedTo" },
          {
            $match: {
              $expr: { $eq: ["$assignedTo", "$$userId"] },
            },
          },
        ],
        as: "assignedTasks",
      },
    },
    // Lookup routine tasks
    {
      $lookup: {
        from: "routinetasks",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              date: { $gte: currentStartDate, $lte: currentEndDate },
            },
          },
          { $unwind: "$performedTasks" },
          {
            $match: {
              "performedTasks.isCompleted": true,
              $expr: { $eq: ["$performedBy", "$$userId"] },
            },
          },
        ],
        as: "routineTasks",
      },
    },
    // Calculate metrics
    {
      $addFields: {
        assignedTaskCount: { $size: "$assignedTasks" },
        routineTaskCount: { $size: "$routineTasks" },
        totalCompleted: {
          $add: [{ $size: "$assignedTasks" }, { $size: "$routineTasks" }],
        },
      },
    },
    // Calculate meaningful rating (0-5)
    {
      $addFields: {
        rating: {
          $min: [
            5,
            {
              $divide: [
                {
                  $add: [
                    "$totalCompleted",
                    {
                      $multiply: [
                        { $min: [5, { $divide: ["$assignedTaskCount", 2] }] },
                        1.5,
                      ],
                    },
                    {
                      $multiply: [
                        { $min: [5, { $divide: ["$routineTaskCount", 3] }] },
                        1.0,
                      ],
                    },
                  ],
                },
                2,
              ],
            },
          ],
        },
      },
    },
    // Conditionally filter out zero ratings (only for leaderboard)
    ...(userId
      ? [] // No filter when getting single user
      : [{ $match: { rating: { $gt: 0 } } }]),
    // Conditionally sort and limit (only for leaderboard)
    ...(userId
      ? [] // No sort/limit for single user
      : [{ $sort: { rating: -1, totalCompleted: -1 } }, { $limit: limit }]),
    // Project final fields
    {
      $project: {
        _id: 0,
        user: {
          _id: "$_id",
          fullName: "$fullName",
          email: "$email",
          position: "$position",
          profilePicture: "$profilePicture",
        },
        assignedTaskCount: 1,
        routineTaskCount: 1,
        totalCompleted: 1,
        rating: { $round: ["$rating", 1] },
      },
    },
  ];

  return leaderboardPipeline;
};

export const getDepartmentPerformancePipeline = ({
  departmentId,
  currentStartDate,
  currentEndDate,
  weights = {
    AssignedTask: 1.0,
    ProjectTask: 1.5,
    RoutineTask: 0.8,
  },
}) => {
  return [
    // Process Task collection (AssignedTask + ProjectTask)
    {
      $match: {
        department: departmentId,
        createdAt: { $gte: currentStartDate, $lte: currentEndDate },
      },
    },
    {
      $project: {
        type: "$taskType",
        completed: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
        weight: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$taskType", "AssignedTask"] },
                then: weights.AssignedTask,
              },
              {
                case: { $eq: ["$taskType", "ProjectTask"] },
                then: weights.ProjectTask,
              },
            ],
            default: weights.RoutineTask,
          },
        },
      },
    },
    // Process RoutineTask collection
    {
      $unionWith: {
        coll: "routinetasks",
        pipeline: [
          {
            $match: {
              department: departmentId,
              date: { $gte: currentStartDate, $lte: currentEndDate },
            },
          },
          { $unwind: "$performedTasks" },
          {
            $addFields: {
              weight: weights.RoutineTask,
            },
          },
          {
            $project: {
              type: { $literal: "RoutineTask" },
              completed: {
                $cond: [{ $eq: ["$performedTasks.isCompleted", true] }, 1, 0],
              },
              weight: 1,
            },
          },
        ],
      },
    },
    // Calculate weighted values
    {
      $addFields: {
        weightedTotal: "$weight",
        weightedCompleted: { $multiply: ["$completed", "$weight"] },
      },
    },
    // Aggregate by task type
    {
      $group: {
        _id: "$type",
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: "$completed" },
        weightedTotal: { $sum: "$weightedTotal" },
        weightedCompleted: { $sum: "$weightedCompleted" },
      },
    },
    // Aggregate overall metrics
    {
      $group: {
        _id: null,
        totalTasks: { $sum: "$totalTasks" },
        completedTasks: { $sum: "$completedTasks" },
        weightedTotal: { $sum: "$weightedTotal" },
        weightedCompleted: { $sum: "$weightedCompleted" },
        breakdown: { $push: "$$ROOT" },
      },
    },
    // Calculate performance metrics with rounding
    {
      $project: {
        _id: 0,
        totalTasks: 1,
        completedTasks: 1,
        incompleteTasks: { $subtract: ["$totalTasks", "$completedTasks"] },
        breakdown: 1,
        weightedPerformance: {
          $cond: [
            { $eq: ["$weightedTotal", 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$weightedCompleted", "$weightedTotal"] },
                    100,
                  ],
                },
                2,
              ],
            },
          ],
        },
        unweightedPerformance: {
          $cond: [
            { $eq: ["$totalTasks", 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$completedTasks", "$totalTasks"] },
                    100,
                  ],
                },
                2,
              ],
            },
          ],
        },
        performanceScore: {
          $cond: [
            { $eq: ["$weightedTotal", 0] },
            {
              $cond: [
                { $eq: ["$totalTasks", 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$completedTasks", "$totalTasks"] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              ],
            },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$weightedCompleted", "$weightedTotal"] },
                    100,
                  ],
                },
                2,
              ],
            },
          ],
        },
      },
    },
  ];
};
