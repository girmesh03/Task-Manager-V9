import express from "express";

import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartmentById,
  deleteDepartmentById,
} from "../controllers/DepartmentController.js";

import { verifyJWT, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware for general routes
router.use(verifyJWT);

// Routes
router.post("/", authorizeRoles("SuperAdmin"), createDepartment);
router.get("/", getAllDepartments);
router.get("/:departmentId", getDepartmentById);

// Middleware for admin-only routes
router.use(authorizeRoles("SuperAdmin"));

router.put("/:departmentId", updateDepartmentById);
router.delete("/:departmentId", deleteDepartmentById);

export default router;
