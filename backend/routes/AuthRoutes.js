import express from "express";

import {
  loginUser,
  verifyEmail,
  logoutUser,
  forgotPassword,
  resetPassword,
  getRefreshToken,
  getMe,
} from "../controllers/AuthController.js";

import authLimiter from "../middlewares/rateLimiter.js";

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
// router.post("/login", authLimiter, validateLogin, loginUser);
router.route("/login").post(loginUser);

// @route   DELETE /api/auth/logout
// @desc    Logout user
// @access  Private
router.route("/logout").delete(logoutUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);
router.get("/refresh", getRefreshToken);
router.get("/me", getMe);

export default router;
