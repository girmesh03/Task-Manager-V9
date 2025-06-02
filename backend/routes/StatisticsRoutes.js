import express from "express";

import {
  getDashboardStats,
  // getUserStatistics,
  // getLeaderboardStats,
} from "../controllers/StatisticsController.js";

import {
  verifyJWT,
  authorizeRoles,
  verifyDepartmentAccess,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT);
router.use(authorizeRoles("SuperAdmin", "Admin", "Manager", "User"));

router.get(
  "/department/:departmentId/dashboard",
  verifyDepartmentAccess,
  getDashboardStats
);

// router.get(
//   "/department/:departmentId/user",
//   verifyDepartmentAccess,
//   getUserStatistics
// );

// router.get(
//   "/department/:departmentId/leaderboard",
//   verifyDepartmentAccess,
//   getLeaderboardStats
// );

export default router;
