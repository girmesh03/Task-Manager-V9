import express from "express";

import {
  createUser,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} from "../controllers/UserController.js";

import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT); // Apply JWT to all following routes

// Create a new user
router.post(
  "/department/:departmentId",
  authorizeRoles("SuperAdmin", "Admin"),
  createUser
);

// Get all users in a department
router.get(
  "/department/:departmentId",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  getAllUsers
);

// Get a user by ID in a department
// TODO: authorizeRoles:who can access this endpoint?
router.get(
  "/department/:departmentId/user/:userId",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  getUserById
);

// Update a user by ID in a department
router.put(
  "/department/:departmentId/user/:userId",
  authorizeRoles("SuperAdmin", "Admin", "User"),
  updateUserById
);

// Get a user by ID
router.delete(
  "/department/:departmentId/user/:userId",
  authorizeRoles("SuperAdmin", "Admin"),
  deleteUserById
);

export default router;
