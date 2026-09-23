const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mailRoutes = require('./routes/mailRoutes');
const authRoutes = require('./routes/authRoutes');
const { pool } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/mail', mailRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mail Service API is running',
    endpoints: {
      signup: 'POST /api/mail/signup',
      forgotPassword: 'POST /api/mail/forgot-password',
      verifyToken: 'GET /api/auth/verify-token/:token',
      resetPassword: 'POST /api/auth/reset-password'
    }
  });
});

// Database health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  await pool.end();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT}`);
  console.log(`Database: ${process.env.DATABASE_URL}`);
  console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`Sender Email: ${process.env.SENDER_EMAIL}`);
});

module.exports = app;
