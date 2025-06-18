import nodemailer from "nodemailer";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "./EmailTemplates.js";
import CustomError from "../errorHandler/CustomError.js";

// Reusable transporter instance
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
});

const sendEmail = async (options) => {
  try {
    await transporter.verify();
    const result = await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
      ...options,
    });
    console.log(`Email sent to ${options.to}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`Email failed to ${options.to}:`, error);
    throw new CustomError(
      `Email delivery failed: ${options.subject}`,
      500,
      "EMAIL-500",
      { recipient: options.to }
    );
  }
};

export const sendVerificationEmail = (email, verificationToken) =>
  sendEmail({
    to: email,
    subject: "Verify Your Email",
    html: VERIFICATION_EMAIL_TEMPLATE.replace(
      "{verificationCode}",
      verificationToken
    ),
    category: "Email Verification",
  });

export const sendResetPasswordEmail = (email, resetURL) =>
  sendEmail({
    to: email,
    subject: "Reset Your Password",
    html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    category: "Password Reset",
  });

export const sendRestSuccessEmail = (email) =>
  sendEmail({
    to: email,
    subject: "Password Reset Successful",
    html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    category: "Password Reset",
  });
