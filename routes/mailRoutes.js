const express = require('express');
const router = express.Router();
const { handleSignup, handleForgotPassword } = require('../controllers/mailController');

/**
 * POST /api/mail/signup
 * Send welcome email after user signup
 * Body: { email: string (required), name: string (optional) }
 */
router.post('/signup', handleSignup);

/**
 * POST /api/mail/forgot-password
 * Send password reset email
 * Body: { email: string (required), name: string (optional) }
 */
router.post('/forgot-password', handleForgotPassword);

module.exports = router;
