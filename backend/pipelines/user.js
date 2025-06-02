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
