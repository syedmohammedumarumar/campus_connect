const nodemailer = require('nodemailer');

/**
 * Send email using Nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
const sendEmail = async (options) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent: ${info.messageId}`);
    return info;
    
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    throw new Error('Failed to send email');
  }
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - OTP code
 */
const sendOTPEmail = async (email, name, otp) => {
  const subject = 'Verify Your Email - Student Network';
  
  const text = `
Hi ${name},

Your verification code is: ${otp}

This code will expire in ${process.env.OTP_EXPIRE || 10} minutes.

If you didn't request this code, please ignore this email.

Best regards,
Student Network Team
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .otp-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .warning { color: #e74c3c; font-size: 14px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Student Network</h1>
      <p>Email Verification</p>
    </div>
    <div class="content">
      <h2>Hi ${name}! 👋</h2>
      <p>Thank you for registering with Student Network. Please use the following code to verify your email address:</p>
      
      <div class="otp-box">
        <p style="margin: 0; color: #666;">Your Verification Code</p>
        <div class="otp-code">${otp}</div>
        <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">Expires in ${process.env.OTP_EXPIRE || 10} minutes</p>
      </div>
      
      <p>Enter this code on the verification page to complete your registration.</p>
      
      <p class="warning">⚠️ If you didn't create an account, please ignore this email.</p>
      
      <p>Best regards,<br><strong>Student Network Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Student Network. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - Reset OTP
 */
const sendPasswordResetEmail = async (email, name, otp) => {
  const subject = 'Reset Your Password - Student Network';
  
  const text = `
Hi ${name},

You requested to reset your password. Your reset code is: ${otp}

This code will expire in ${process.env.OTP_EXPIRE || 10} minutes.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
Student Network Team
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .otp-box { background: white; border: 2px dashed #f5576c; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 5px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .warning { color: #e74c3c; font-size: 14px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset</h1>
      <p>Student Network</p>
    </div>
    <div class="content">
      <h2>Hi ${name}! 👋</h2>
      <p>We received a request to reset your password. Use the following code to proceed:</p>
      
      <div class="otp-box">
        <p style="margin: 0; color: #666;">Your Reset Code</p>
        <div class="otp-code">${otp}</div>
        <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">Expires in ${process.env.OTP_EXPIRE || 10} minutes</p>
      </div>
      
      <p>Enter this code on the password reset page to create a new password.</p>
      
      <p class="warning">⚠️ If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
      
      <p>Best regards,<br><strong>Student Network Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Student Network. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({ to: email, subject, text, html });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail
};