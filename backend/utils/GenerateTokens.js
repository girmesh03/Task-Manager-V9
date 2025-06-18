import jwt from "jsonwebtoken";
import CustomError from "../errorHandler/CustomError.js";

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY = "7d";
const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const generateAccessToken = (res, user) => {
  if (!user || !user._id || !user.role) {
    throw new CustomError(
      "Invalid user data for token generation",
      500,
      "AUTH-500"
    );
  }

  const accessToken = jwt.sign(
    {
      _id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
    domain: process.env.COOKIE_DOMAIN || "localhost",
  });

  return accessToken;
};

export const generateRefreshToken = (res, user) => {
  const refreshToken = jwt.sign(
    {
      _id: user._id,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/api/auth/refresh-token",
    domain: process.env.COOKIE_DOMAIN || "localhost",
  });

  return refreshToken;
};
