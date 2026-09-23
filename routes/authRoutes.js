const express = require('express');
const router = express.Router();
const { verifyResetToken, resetPassword } = require('../controllers/authController');

/**
 * GET /api/auth/verify-token/:token
 * Verify if a reset token is valid
 */
router.get('/verify-token/:token', verifyResetToken);

/**
 * POST /api/auth/reset-password
 * Reset password using valid token
 * Body: { token: string (required), newPassword: string (required) }
 */
router.post('/reset-password', resetPassword);

module.exports = router;
