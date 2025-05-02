const { sendEmail } = require('./emailService');

/**
 * Send an organization invitation email
 * @param {string} to - Recipient email address
 * @param {string} inviteLink - The invitation link
 * @param {string} organizationName - The organization name
 * @param {string} leaderName - The leader's name who sent the invitation
 */
const sendOrganizationInviteEmail = async (to, inviteLink, organizationName, leaderName) => {
  const subject = `Invitation to join ${organizationName} on InternStart`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a6ee0;">InternStart Organization Invitation</h2>
      <p>Hello,</p>
      <p>You have been invited by <strong>${leaderName}</strong> to join <strong>${organizationName}</strong> on InternStart.</p>
      <p>Click the button below to accept the invitation:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" 
           style="background-color: #4a6ee0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Join Organization
        </a>
      </div>
      <p>If you don't have an account yet, you'll be prompted to create one first.</p>
      <p>This invitation link will expire in 7 days.</p>
      <p>Best regards,<br>The InternStart Team</p>
    </div>
  `;

  return sendEmail(to, subject, html);
};

module.exports = {
  sendOrganizationInviteEmail
};
