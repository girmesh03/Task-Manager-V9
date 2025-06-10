import express from "express";

import {
  getAllDepartments,
  getAllUsers,
} from "../controllers/AdminController.js";

import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware for general routes
router.use(verifyJWT);
router.use(authorizeRoles("SuperAdmin"));

// Routes
router.get("/departments", getAllDepartments);
router.get("/users", getAllUsers);

// Export the router
export default router;
