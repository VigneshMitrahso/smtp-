const { findValidResetToken, markTokenAsUsed, deleteUserTokens } = require('../models/resetTokenModel');
const { updatePassword, findUserById } = require('../models/userModel');

/**
 * Verify reset token
 * GET /api/auth/verify-token/:token
 */
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Find valid token
    const tokenData = await findValidResetToken(token);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: tokenData.email,
        expiresAt: tokenData.expires_at
      }
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token',
      error: error.message
    });
  }
};

/**
 * Reset password using token
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find valid token
    const tokenData = await findValidResetToken(token);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Update user password
    await updatePassword(tokenData.user_id, newPassword);

    // Mark token as used
    await markTokenAsUsed(tokenData.id);

    // Delete all other tokens for this user
    await deleteUserTokens(tokenData.user_id);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        email: tokenData.email
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

module.exports = {
  verifyResetToken,
  resetPassword
};
