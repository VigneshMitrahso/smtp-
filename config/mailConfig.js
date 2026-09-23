const nodemailer = require('nodemailer');

/**
 * Create and configure nodemailer transporter
 */
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
};

/**
 * Verify SMTP connection
 */
const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('✗ SMTP connection failed:', error.message);
    return false;
  }
};

module.exports = {
  createTransporter,
  verifyConnection
};
