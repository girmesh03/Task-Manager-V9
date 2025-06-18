// backend/utils/EmailTemplates.js
// Purpose: Stores HTML templates for emails.
// Interactions: Imported and used by SendEmail.js.
// Edge Cases: None.
// Dependencies: None.
// Improvements: Could use a templating engine for complex emails, but current approach is fine.
export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;}
    .container { background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .code-container { text-align: center; margin: 30px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50; background-color: #e9e9eb; padding: 10px 20px; border-radius: 5px; display: inline-block; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 0.8em; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for signing up! To complete your registration and activate your account, please use the verification code below:</p>
      <div class="code-container">
        <span class="code">{verificationCode}</span>
      </div>
      <p>Enter this code on the verification page in the application.</p>
      <p>This code is valid for a limited time for security reasons.</p>
      <p>If you did not create an account with us, please ignore this email.</p>
      <p>Best regards,<br>Your App Team</p>
    </div>
  </div>
  <div class="footer">
    <p>This is an automated message, please do not reply.</p>
    <p>© {currentYear} Your App Team. All rights reserved.</p>
  </div>
  <script>document.getElementById('currentYear').textContent = new Date().getFullYear();</script>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
   <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center; color: white; }
     .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
     .icon-container { text-align: center; margin: 30px 0; }
    .success-icon { background-color: #4CAF50; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; display: inline-block; font-size: 30px; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 0.8em; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Successful</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We're writing to confirm that your password has been successfully reset.</p>
      <div class="icon-container">
        <div class="success-icon">✓</div>
      </div>
      <p>If you did not initiate this password reset, please contact our support team immediately.</p>
      <p>For security reasons, we recommend that you:</p>
      <ul>
        <li>Use a strong, unique password</li>
        <li>Enable two-factor authentication if available</li>
        <li>Avoid using the same password across multiple sites</li>
      </ul>
      <p>Thank you for helping us keep your account secure.</p>
      <p>Best regards,<br>Your App Team</p>
    </div>
  </div>
  <div class="footer">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>© <span id="currentYear"></span> Your App Team. All rights reserved.</p>
  </div>
   <script>document.getElementById('currentYear').textContent = new Date().getFullYear();</script>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
   <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
     .container { background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 0.8em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <div class="button-container">
        <a href="{resetURL}" class="button">Reset Password</a>
      </div>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you need assistance, please contact support.</p>
      <p>Best regards,<br>Your App Team</p>
    </div>
  </div>
  <div class="footer">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>© <span id="currentYear"></span> Your App Team. All rights reserved.</p>
  </div>
   <script>document.getElementById('currentYear').textContent = new Date().getFullYear();</script>
</body>
</html>
`;
