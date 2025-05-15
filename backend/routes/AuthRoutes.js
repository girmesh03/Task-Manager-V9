import express from "express";

import {
  login,
  verifyEmail,
  logout,
  forgotPassword,
  resetPassword,
  getRefreshToken,
  getMe,
} from "../controllers/AuthController.js";

import authLimiter from "../middlewares/rateLimiter.js";

const router = express.Router();

router.use("/login", authLimiter);
router.use("/verify-email", authLimiter);
router.use("/forgot-password", authLimiter);
router.use("/reset-password/:resetToken", authLimiter);

router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);
router.get("/refresh", getRefreshToken);
router.get("/me", getMe);

export default router;
