const db = require('../config/database');
const crypto = require('crypto');

/**
 * Create a password reset token
 */
const createResetToken = async (userId) => {
  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiry time (default 1 hour from now)
  const expiryHours = parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS) || 1;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  const query = `
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, token, expires_at, created_at
  `;
  
  const result = await db.query(query, [userId, token, expiresAt]);
  return result.rows[0];
};

/**
 * Find valid reset token
 */
const findValidResetToken = async (token) => {
  const query = `
    SELECT rt.id, rt.user_id, rt.token, rt.expires_at, rt.used,
           u.email, u.name
    FROM password_reset_tokens rt
    INNER JOIN users u ON rt.user_id = u.id
    WHERE rt.token = $1
      AND rt.used = FALSE
      AND rt.expires_at > CURRENT_TIMESTAMP
  `;
  
  const result = await db.query(query, [token]);
  return result.rows[0] || null;
};

/**
 * Mark token as used
 */
const markTokenAsUsed = async (tokenId) => {
  const query = `
    UPDATE password_reset_tokens
    SET used = TRUE
    WHERE id = $1
    RETURNING id, token, used
  `;
  
  const result = await db.query(query, [tokenId]);
  return result.rows[0];
};

/**
 * Delete expired tokens (cleanup)
 */
const deleteExpiredTokens = async () => {
  const query = `
    DELETE FROM password_reset_tokens
    WHERE expires_at < CURRENT_TIMESTAMP
    RETURNING id
  `;
  
  const result = await db.query(query);
  return result.rowCount;
};

/**
 * Delete all tokens for a user (useful when user changes password)
 */
const deleteUserTokens = async (userId) => {
  const query = `
    DELETE FROM password_reset_tokens
    WHERE user_id = $1
    RETURNING id
  `;
  
  const result = await db.query(query, [userId]);
  return result.rowCount;
};

/**
 * Get token statistics for a user
 */
const getUserTokenStats = async (userId) => {
  const query = `
    SELECT 
      COUNT(*) as total_tokens,
      COUNT(CASE WHEN used = TRUE THEN 1 END) as used_tokens,
      COUNT(CASE WHEN expires_at < CURRENT_TIMESTAMP THEN 1 END) as expired_tokens
    FROM password_reset_tokens
    WHERE user_id = $1
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

module.exports = {
  createResetToken,
  findValidResetToken,
  markTokenAsUsed,
  deleteExpiredTokens,
  deleteUserTokens,
  getUserTokenStats
};
