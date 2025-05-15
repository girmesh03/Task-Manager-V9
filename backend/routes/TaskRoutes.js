import express from "express";

import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTaskById,
  deleteTaskById,
  createTaskActivity,
  getTaskActivities,
  deleteTaskActivity,
} from "../controllers/TaskController.js";

import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT);

// Create Task in a Department
router.post(
  "/department/:departmentId",
  authorizeRoles("SuperAdmin", "Admin", "Manager"),
  createTask
);

// Get All Tasks of a Department
router.get(
  "/department/:departmentId",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  getAllTasks
);

// Get Task by ID in a Department
router.get(
  "/department/:departmentId/task/:taskId",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  getTaskById
);

// Update Task by ID in a Department
router.put(
  "/department/:departmentId/task/:taskId",
  authorizeRoles("SuperAdmin", "Admin", "Manager"),
  updateTaskById
);

// Delete Task by ID in a Department
router.delete(
  "/department/:departmentId/task/:taskId",
  authorizeRoles("SuperAdmin", "Admin", "Manager"),
  deleteTaskById
);

// Create Task Activities
router.post(
  "/:taskId/activities",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  createTaskActivity
);

// Get Task Activities
router.get(
  "/:taskId/activities",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  getTaskActivities
);

// Delete Task Activity
router.delete(
  "/:taskId/activities/:activityId",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  deleteTaskActivity
);

export default router;
