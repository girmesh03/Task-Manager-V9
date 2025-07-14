import express from "express";

import {
  createUser,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getUserProfileById,
  getUsersStatistics,
} from "../controllers/UserController.js";

import {
  updateMyDetails,
  changeMyPassword,
  initiateEmailChange,
  verifyEmailChange,
  updateMyProfilePicture,
} from "../controllers/AccountController.js";

import {
  verifyJWT,
  authorizeRoles,
  verifyDepartmentAccess,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT); // Apply JWT to all following routes

// Create a new user
router.post(
  "/department/:departmentId",
  authorizeRoles("SuperAdmin"),
  verifyDepartmentAccess,
  createUser
);

// Get all users in a department
router.get(
  "/department/:departmentId",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  verifyDepartmentAccess,
  getAllUsers
);

// Get a user by ID in a department
router.get(
  "/department/:departmentId/user/:userId",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  verifyDepartmentAccess,
  getUserById
);

// Update a user by ID in a department
router.put(
  "/department/:departmentId/user/:userId",
  authorizeRoles("SuperAdmin", "Admin", "User"),
  verifyDepartmentAccess,
  updateUserById
);

// Get a user by ID
router.delete(
  "/department/:departmentId/user/:userId",
  authorizeRoles("SuperAdmin", "Admin"),
  verifyDepartmentAccess,
  deleteUserById
);

// Get a user profile
router.get(
  "/department/:departmentId/user/:userId/profile",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  verifyDepartmentAccess,
  getUserProfileById
);

// Get users statistics
router.get(
  "/department/:departmentId/statistics",
  authorizeRoles("SuperAdmin", "Admin", "Manager", "User"),
  verifyDepartmentAccess,
  getUsersStatistics
);

// User account management routes
router.put("/:userId/details", updateMyDetails);
router.put("/:userId/password", changeMyPassword);
router.put("/:userId/profile-picture", updateMyProfilePicture);
router.post("/:userId/initiate-email-change", initiateEmailChange);
router.post("/:userId/verify-email-change", verifyEmailChange);

export default router;
