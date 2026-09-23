const db = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * Create a new user
 */
const createUser = async (email, name, password = null) => {
  try {
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const query = `
      INSERT INTO users (email, name, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, is_verified, created_at
    `;
    
    const result = await db.query(query, [email, name, passwordHash]);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Email already exists');
    }
    throw error;
  }
};

/**
 * Find user by email
 */
const findUserByEmail = async (email) => {
  const query = `
    SELECT id, email, name, password_hash, is_verified, created_at, updated_at
    FROM users
    WHERE email = $1
  `;
  
  const result = await db.query(query, [email]);
  return result.rows[0] || null;
};

/**
 * Find user by ID
 */
const findUserById = async (userId) => {
  const query = `
    SELECT id, email, name, is_verified, created_at, updated_at
    FROM users
    WHERE id = $1
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
};

/**
 * Update user verification status
 */
const verifyUser = async (userId) => {
  const query = `
    UPDATE users
    SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, name, is_verified
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

/**
 * Update user password
 */
const updatePassword = async (userId, newPassword) => {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  const query = `
    UPDATE users
    SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, email, name
  `;
  
  const result = await db.query(query, [passwordHash, userId]);
  return result.rows[0];
};

/**
 * Verify password
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUser,
  updatePassword,
  verifyPassword
};
