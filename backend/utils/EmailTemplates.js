// backend/utils/EmailTemplates.js
// Purpose: Contains standard HTML templates for application emails.
// Interaction: Used by SendEmail.js to provide the HTML content for emails.
// Dependencies: None.
// Considerations: Using simple string replacement. For highly dynamic/complex emails,
// a dedicated templating engine (like Pug, EJS, Handlebars) could be beneficial.
// HTML structure and styles are embedded. Ensure accessibility and mobile-friendliness.

/**
 * HTML template for user email verification.
 * Includes a placeholder `{verificationCode}` for injecting the specific code.
 */
export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email Address</title>
  <style>
    /* Basic styles for email clients */
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.6; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #ddd; }
    .header { background: linear-gradient(to right, #28a745, #218838); padding: 25px 20px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 26px; font-weight: normal; }
    .content { padding: 30px 30px; }
    .content p { margin-bottom: 15px; font-size: 16px; }
    .code-container { text-align: center; margin: 35px 0; padding: 15px; background-color: #e9ecef; border-radius: 6px; border: 1px dashed #adb5bd; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #28a745; display: inline-block; user-select: all; word-break: break-all; }
    .note { font-size: 14px; color: #6c757d; margin-top: 25px; }
    .footer { text-align: center; margin-top: 25px; color: #888; font-size: 12px; padding: 0 20px 20px; }
     .footer a { color: #888; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1>Verify Your Email Address</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for joining us! To activate your account and unlock full access, please use the verification code provided below:</p>
      <div class="code-container">
        <span class="code">{verificationCode}</span>
      </div>
      <p class="note">Please enter this code on the email verification page within the application.</p>
      <p>For your security, this code is valid for a limited time and for a single use.</p>
      <p>If you did not attempt to register or verify your email, please disregard this message.</p>
      <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
      <p>This email was sent automatically. Please do not reply.</p>
      <p>© <span id="currentYear"></span> Your App Team. All rights reserved.</p>
    </div>
  </div>
  <script>document.getElementById('currentYear').textContent = new Date().getFullYear();</script>
</body>
</html>
`;

/**
 * HTML template for a successful password reset confirmation.
 * Confirms the password has been changed.
 */
export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Password Has Been Reset</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.6; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #ddd; }
    .header { background: linear-gradient(to right, #28a745, #218838); padding: 25px 20px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 26px; font-weight: normal; }
    .content { padding: 30px 30px; text-align: center; } /* Center content for the icon */
     .content p { margin-bottom: 15px; font-size: 16px; text-align: left; } /* Reset text align for paragraphs */
     .icon-container { margin: 30px 0; }
     .success-icon { display: inline-block; background-color: #28a745; color: white; font-size: 40px; border-radius: 50%; width: 60px; height: 60px; line-height: 60px; text-align: center; } /* Adjusted icon size */
     .footer { text-align: center; margin-top: 25px; color: #888; font-size: 12px; padding: 0 20px 20px; }
      .footer a { color: #888; text-decoration: none; }
     ul { text-align: left; padding-left: 25px; margin-bottom: 15px;} /* Styles for bullet points */
      li { margin-bottom: 8px;}
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1>Password Reset Successful</h1>
    </div>
    <div class="content">
       <p>Hello,</p>
       <p>This is a confirmation that the password for your account has been successfully updated.</p>
      <div class="icon-container">
        <div class="success-icon">✓</div>
      </div>
      <p>If you did NOT perform this password reset, please contact our support team immediately.</p>
      <p>For enhanced security, we recommend:</p>
      <ul>
        <li>Using a strong, unique password that hasn't been used elsewhere.</li>
        <li>Enabling multi-factor authentication (MFA) if available for your account.</li>
        <li>Periodically reviewing your account activity.</li>
      </ul>
      <p>Thank you for your vigilance in maintaining your account security.</p>
      <p>Best regards,<br>The Team</p>
    </div>
     <div class="footer">
      <p>This email was sent automatically. Please do not reply.</p>
      <p>© <span id="currentYear"></span> Your App Team. All rights reserved.</p>
    </div>
  </div>
  <script>document.getElementById('currentYear').textContent = new Date().getFullYear();</script>
</body>
</html>
`;

/**
 * HTML template for prompting a password reset request.
 * Includes a placeholder `{resetURL}` for injecting the reset link.
 */
export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Action Required: Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.6; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
     .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #ddd; }
    .header { background: linear-gradient(to right, #dc3545, #c82333); padding: 25px 20px; text-align: center; color: white; } /* Using a warning/alert color */
    .header h1 { margin: 0; font-size: 26px; font-weight: normal; }
    .content { padding: 30px 30px; }
     .content p { margin-bottom: 15px; font-size: 16px; }
    .button-container { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background-color: #dc3545; color: white !important; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; font-size: 16px; }
     .button:hover { background-color: #c82333; } /* Simple hover style */
    .note { font-size: 14px; color: #6c757d; margin-top: 25px; }
    .footer { text-align: center; margin-top: 25px; color: #888; font-size: 12px; padding: 0 20px 20px; }
     .footer a { color: #888; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset the password for your account. If you did not initiate this request, please disregard this email; no action is required from your end.</p>
      <p>To proceed with resetting your password, please click the link below:</p>
      <div class="button-container">
        <a href="{resetURL}" class="button" target="_blank" rel="noopener noreferrer">Reset My Password</a>
      </div>
      <p class="note">This password reset link is valid for a single use and will expire in 1 hour for security purposes.</p>
      <p>If the button above doesn't work, you can copy and paste the following URL into your web browser:</p>
      <p><small>{resetURL}</small></p>
      <p>If you require any assistance, please contact our support team.</p>
      <p>Best regards,<br>The Team</p>
    </div>
     <div class="footer">
      <p>This email was sent automatically. Please do not reply.</p>
      <p>© <span id="currentYear"></span> Your App Team. All rights reserved.</p>
    </div>
  </div>
  <script>document.getElementById('currentYear').textContent = new Date().getFullYear();</script>
</body>
</html>
`;
