import { Router } from "express";
import AuthRoutes from "./AuthRoutes.js";
import UserRoutes from "./UserRoutes.js";
import DepartmentRoutes from "./DepartmentRoutes.js";
import TaskRoutes from "./TaskRoutes.js";
import RoutineTaskRoutes from "./RoutineTaskRoutes.js";
import StatisticsRoutes from "./StatisticsRoutes.js";
import ReportRoutes from "./ReportRoutes.js";
import AdminRoutes from "./AdminRoutes.js";
import NotificationRoutes from "./NotificationRoutes.js";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/departments", DepartmentRoutes);
router.use("/tasks", TaskRoutes);
router.use("/routine-tasks", RoutineTaskRoutes);
router.use("/statistics", StatisticsRoutes);
router.use("/reports", ReportRoutes);
router.use("/admin", AdminRoutes);
router.use("/notifications", NotificationRoutes);

export default router;
