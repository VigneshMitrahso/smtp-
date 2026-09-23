const { getMailConfig } = require('../config/mailConfig');

/**
 * Send email via HTTP Mail Service API
 * Replaces direct SMTP to prevent connection hangs and timeouts
 */
const sendEmail = async (to, subject, htmlContent, textContent = '', fromEmail = null, fromName = null) => {
  try {
    const config = getMailConfig();

    // Build request payload
    const payload = {
      to: to,
      subject: subject,
      html: htmlContent,
      fromName: fromName || config.senderName,
      async: config.async // Non-blocking: returns 202 immediately
    };

    // Add optional from email
    if (fromEmail || config.senderEmail) {
      payload.from = fromEmail || config.senderEmail;
    }

    // Add optional text content
    if (textContent) {
      payload.text = textContent;
    }

    // Build request headers
    const headers = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    // Send HTTP request to mail service
    const response = await fetch(`${config.apiUrl}/api/mail/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Mail service responded with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log('✓ Email sent successfully via Mail Service API');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Message ID: ${data.messageId || 'N/A'}`);
    
    return {
      success: true,
      messageId: data.messageId || data.id || 'async-queued',
      message: 'Email sent successfully',
      data: data
    };
  } catch (error) {
    console.error('✗ Error sending email via Mail Service API:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send signup welcome email
 */
const sendSignupEmail = async (userEmail, userName) => {
  const subject = 'Welcome to DB Nexus!';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to DB Nexus!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName || 'there'}!</h2>
          <p>Thank you for signing up with DB Nexus. We're excited to have you on board!</p>
          <p>Your account has been successfully created and you can now access all our features.</p>
          <p>Here are some things you can do to get started:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore our dashboard</li>
            <li>Connect with our community</li>
          </ul>
          <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The DB Nexus Team</p>
        </div>
        <div class="footer">
          <p>© 2026 DB Nexus. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Welcome to DB Nexus!
    
    Hello ${userName || 'there'}!
    
    Thank you for signing up with DB Nexus. We're excited to have you on board!
    
    Your account has been successfully created and you can now access all our features.
    
    If you have any questions or need assistance, feel free to reach out to our support team.
    
    Best regards,
    The DB Nexus Team
  `;

  return await sendEmail(userEmail, subject, htmlContent, textContent);
};

/**
 * Send forgot password email with reset link
 */
const sendForgotPasswordEmail = async (userEmail, resetToken, userName) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        .token-box { background-color: #e9ecef; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName || 'there'}!</h2>
          <p>We received a request to reset your password for your DB Nexus account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
          <div class="token-box">${resetLink}</div>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0;">
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          <p>If you have any concerns about your account security, please contact our support team immediately.</p>
          <p>Best regards,<br>The DB Nexus Team</p>
        </div>
        <div class="footer">
          <p>© 2026 DB Nexus. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Password Reset Request
    
    Hello ${userName || 'there'}!
    
    We received a request to reset your password for your DB Nexus account.
    
    Please use the following link to reset your password:
    ${resetLink}
    
    Security Notice:
    - This link will expire in 1 hour
    - If you didn't request this password reset, please ignore this email
    - Never share this link with anyone
    
    If you have any concerns about your account security, please contact our support team immediately.
    
    Best regards,
    The DB Nexus Team
  `;

  return await sendEmail(userEmail, subject, htmlContent, textContent);
};

module.exports = {
  sendEmail,
  sendSignupEmail,
  sendForgotPasswordEmail
};
