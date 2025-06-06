import express from "express";

import {
  getTaskReport,
  getRoutineTaskReport,
} from "../controllers/ReportController.js";

import {
  verifyJWT,
  authorizeRoles,
  verifyDepartmentAccess,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT);
router.use(authorizeRoles("SuperAdmin", "Admin", "Manager"));

router.get(
  "/department/:departmentId/tasks",
  verifyDepartmentAccess,
  getTaskReport
);

router.get(
  "/department/:departmentId/routines",
  verifyDepartmentAccess,
  getRoutineTaskReport
);

export default router;
