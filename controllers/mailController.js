const { sendSignupEmail, sendForgotPasswordEmail } = require('../services/mailService');
// const { createUser, findUserByEmail } = require('../models/userModel');
// const { createResetToken } = require('../models/resetTokenModel');
// const { logEmail } = require('../models/emailLogModel');

/**
 * Handle signup email sending
 * POST /api/mail/signup
 * Body: { email, name, password (optional) }
 */
const handleSignup = async (req, res) => {
  const { email, name, password } = req.body;
  
  try {
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // DATABASE OPERATIONS COMMENTED OUT FOR SMTP TESTING ONLY
    // Check if user already exists
    // const existingUser = await findUserByEmail(email);
    // if (existingUser) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'User with this email already exists'
    //   });
    // }

    // Create user in database
    // const user = await createUser(email, name, password);

    // Send signup email (SMTP TEST)
    const emailResult = await sendSignupEmail(email, name);

    // Log email sent
    // await logEmail(user.id, email, 'signup', 'Welcome to DB Nexus!', emailResult.messageId, 'sent');

    res.status(201).json({
      success: true,
      message: 'Signup email sent successfully (SMTP TEST MODE)',
      data: {
        email: email,
        name: name,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Log failed email
    // if (email) {
    //   try {
    //     await logEmail(null, email, 'signup', 'Welcome to DB Nexus!', null, 'failed', error.message);
    //   } catch (logError) {
    //     console.error('Failed to log email error:', logError);
    //   }
    // }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send signup email',
      error: error.message
    });
  }
};

/**
 * Handle forgot password email sending
 * POST /api/mail/forgot-password
 * Body: { email }
 */
const handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // DATABASE OPERATIONS COMMENTED OUT FOR SMTP TESTING ONLY
    // Find user by email
    // const user = await findUserByEmail(email);
    
    // Security: Don't reveal if user exists or not
    // Always return success message
    // if (!user) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'If an account exists with this email, a password reset link has been sent'
    //   });
    // }

    // Create reset token in database
    // const resetTokenData = await createResetToken(user.id);

    // Generate a dummy token for testing
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Send forgot password email (SMTP TEST)
    const emailResult = await sendForgotPasswordEmail(email, resetToken, 'User');

    // Log email sent
    // await logEmail(user.id, email, 'password_reset', 'Password Reset Request', emailResult.messageId, 'sent');

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully (SMTP TEST MODE)',
      data: {
        email: email,
        messageId: emailResult.messageId,
        resetToken: resetToken,
        tokenExpiresAt: expiresAt
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Log failed email
    // if (email) {
    //   try {
    //     await logEmail(null, email, 'password_reset', 'Password Reset Request', null, 'failed', error.message);
    //   } catch (logError) {
    //     console.error('Failed to log email error:', logError);
    //   }
    // }

    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error.message
    });
  }
};

module.exports = {
  handleSignup,
  handleForgotPassword
};
