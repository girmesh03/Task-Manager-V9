import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";

// All departments pipeline for Admin DataGrid
export async function fetchAllDepartmentsAggregated({ page, limit }) {
  const skip = (page - 1) * limit;

  const aggregationPipeline = [
    // 1. Lookup managers and select only necessary fields
    {
      $lookup: {
        from: "users", // Collection name for UserModel
        localField: "managers",
        foreignField: "_id",
        pipeline: [{ $project: { _id: 1, firstName: 1, lastName: 1 } }],
        as: "managerDetails",
      },
    },
    // 2. Lookup members to count them
    {
      $lookup: {
        from: "users",
        localField: "_id", // Department's _id
        foreignField: "department", // User's department field
        as: "members",
      },
    },
    // 3. Add fields for manager names and member count
    {
      $addFields: {
        managerNames: {
          $reduce: {
            input: "$managerDetails",
            initialValue: "",
            in: {
              $cond: {
                if: { $eq: ["$$value", ""] },
                then: { $concat: ["$$this.firstName", " ", "$$this.lastName"] },
                else: {
                  $concat: [
                    "$$value",
                    ", ",
                    "$$this.firstName",
                    " ",
                    "$$this.lastName",
                  ],
                },
              },
            },
          },
        },
        memberCount: { $size: "$members" },
      },
    },
    // 4. Project the final fields for the department rows
    {
      $project: {
        _id: 1, // Will be mapped to 'id' in controller
        name: 1,
        description: 1,
        managerNames: 1,
        memberCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    // 5. Sort (optional, e.g., by name)
    {
      $sort: { name: 1 },
    },
    // 6. Pagination using $facet
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
    // 7. Transform Facet Result
    {
      $project: {
        rows: "$paginatedResults",
        rowCount: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
      },
    },
  ];

  const results = await Department.aggregate(aggregationPipeline).exec();
  return results[0] || { rows: [], rowCount: 0 };
}

// All users pipeline for Admin DataGrid
export async function fetchAllUsersAggregated({ page, limit }) {
  const skip = (page - 1) * limit;

  const aggregationPipeline = [
    // 1. Lookup department details
    {
      $lookup: {
        from: "departments", // Collection name for DepartmentModel
        localField: "department",
        foreignField: "_id",
        pipeline: [
          { $project: { _id: 0, name: 1 } }, // Select only department name
        ],
        as: "departmentInfo",
      },
    },
    // 2. Unwind departmentInfo (users should always have a department as per model)
    {
      $unwind: {
        path: "$departmentInfo",
        preserveNullAndEmptyArrays: true, // In case a user somehow misses a department
      },
    },
    // 3. Add fields for fullName and departmentName
    {
      $addFields: {
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
        departmentName: { $ifNull: ["$departmentInfo.name", "N/A"] },
      },
    },
    // 4. Project the final fields for the user rows
    {
      $project: {
        _id: 1, // Will be mapped to 'id' in controller
        fullName: 1,
        email: 1,
        position: 1,
        role: 1,
        departmentName: 1,
        isVerified: 1,
        isActive: 1,
        profilePicture: 1, // Include profilePicture if needed by DataGrid
        createdAt: 1,
        updatedAt: 1,
      },
    },
    // 5. Sort (optional, e.g., by fullName)
    {
      $sort: { fullName: 1 },
    },
    // 6. Pagination using $facet
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
    // 7. Transform Facet Result
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
