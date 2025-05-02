const nodemailer = require('nodemailer');

// Create reusable transporter with configuration from .env
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_ENCRYPTION === 'ssl', // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });
};

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email content in HTML format
 * @returns {Promise} - Result from email sending operation
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - The reset token
 * @param {string} username - The user's name
 */
const sendPasswordResetEmail = async (to, resetToken, username) => {
  const resetUrl = `${process.env.PASSWORD_RESET_URL}/${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a6ee0;">InternStart Password Reset</h2>
      <p>Hello ${username},</p>
      <p>You have requested to reset your password. Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #4a6ee0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      <p>Best regards,<br>The InternStart Team</p>
    </div>
  `;

  return sendEmail(to, 'Password Reset Request', html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail
};
