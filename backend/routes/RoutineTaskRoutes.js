import express from "express";

import {
  createRoutineTask,
  getAllRoutineTasks,
  getRoutineTaskById,
  updateRoutineTask,
  deleteRoutineTask,
} from "../controllers/RoutineTaskController.js";

import {
  verifyJWT,
  authorizeRoles,
  verifyDepartmentAccess,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT);
router.use(authorizeRoles("SuperAdmin", "Admin", "Manager", "User"));

// Create Routine Task in a Department
router.post(
  "/department/:departmentId",
  verifyDepartmentAccess,
  createRoutineTask
);

// Get All Routine Tasks of a Department
router.get(
  "/department/:departmentId",
  verifyDepartmentAccess,
  getAllRoutineTasks
);

// Get Routine Task of a Department by ID
router.get(
  "/department/:departmentId/task/:taskId",
  verifyDepartmentAccess,
  getRoutineTaskById
);

// Update Routine Task of a Department by ID
router.put(
  "/department/:departmentId/task/:taskId",
  verifyDepartmentAccess,
  updateRoutineTask
);

// Delete Routine Task of a Department by ID
router.delete(
  "/department/:departmentId/task/:taskId",
  verifyDepartmentAccess,
  deleteRoutineTask
);

export default router;
