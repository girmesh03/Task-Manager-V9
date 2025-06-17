import express from "express";

import {
  getNotificationStats,
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from "../controllers/NotificationController.js";

import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/stats", getNotificationStats);

router.get("/", getNotifications);

router.patch("/read", markAsRead);

router.post("/read-all", markAllAsRead);

router.delete("/clear", clearNotifications);

export default router;
