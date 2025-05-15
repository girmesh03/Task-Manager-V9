// backend/utils/GenerateTokens.js
import jwt from "jsonwebtoken";

export const generateAccessToken = (res, user) => {
  const accessToken = jwt.sign(
    {
      _id: user._id,
      role: user.role,
      email: user.email,
      departmentId: user.department._id,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "7d", // 7 days
      // expiresIn: "1h", // 1 hour
      // expiresIn: "30s", // 30 seconds for test
    }
  );

  // Set cookies
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // maxAge: 1 * 60 * 60 * 1000, // 1 hour
    // maxAge: 30 * 1000, // 30 seconds for test
  });

  return accessToken;
};

export const generateRefreshToken = (res, user) => {
  const refreshToken = jwt.sign(
    {
      _id: user._id,
      role: user.role,
      email: user.email,
      departmentId: user.department_id,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d", // 7 days
      // expiresIn: "1m", // 1 minute for test
    }
  );

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // maxAge: 1 * 60 * 1000, // 1 minute for test
  });

  return refreshToken;
};
