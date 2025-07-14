// backend/utils/SendEmail.js
import nodemailer from "nodemailer";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "./EmailTemplates.js";
import CustomError from "../errorHandler/CustomError.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify Your Email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email Verification",
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new CustomError("Error sending verification email", 500, "EMAIL-500");
  }
};

export const sendResetPasswordEmail = async (email, resetURL) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password Reset",
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new CustomError(
      "Error sending password reset email",
      500,
      "EMAIL-500"
    );
  }
};

export const sendRestSuccessEmail = async (email) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset",
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new CustomError(
      "Error sending password reset success email",
      500,
      "EMAIL-500"
    );
  }
};
