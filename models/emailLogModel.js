const db = require('../config/database');

/**
 * Log email sent
 */
const logEmail = async (userId, emailTo, emailType, subject, messageId, status = 'sent', errorMessage = null) => {
  const query = `
    INSERT INTO email_logs (user_id, email_to, email_type, subject, message_id, status, error_message)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, created_at
  `;
  
  const result = await db.query(query, [userId, emailTo, emailType, subject, messageId, status, errorMessage]);
  return result.rows[0];
};

/**
 * Get email logs for a user
 */
const getUserEmailLogs = async (userId, limit = 50) => {
  const query = `
    SELECT id, email_to, email_type, subject, message_id, status, error_message, created_at
    FROM email_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;
  
  const result = await db.query(query, [userId, limit]);
  return result.rows;
};

/**
 * Get email statistics
 */
const getEmailStats = async (startDate = null, endDate = null) => {
  let query = `
    SELECT 
      email_type,
      status,
      COUNT(*) as count
    FROM email_logs
  `;
  
  const params = [];
  if (startDate && endDate) {
    query += ` WHERE created_at BETWEEN $1 AND $2`;
    params.push(startDate, endDate);
  }
  
  query += ` GROUP BY email_type, status ORDER BY email_type, status`;
  
  const result = await db.query(query, params);
  return result.rows;
};

module.exports = {
  logEmail,
  getUserEmailLogs,
  getEmailStats
};
