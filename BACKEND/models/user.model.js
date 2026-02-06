/**
 * User Model (Data Access Layer)
 * 
 * This module handles all database operations for users table.
 * Provides functions for user CRUD operations and authentication queries.
 * 
 * @module models/user.model
 * @author Backend Team
 * @collaborators 8-person team
 */

import pool from "../configs/db.js";

/**
 * Find a user by email address.
 * Used during login and registration to check for existing users.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} User object if found, null otherwise
 */
async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT user_id, name, email, password, role, is_deleted, last_login, created_at, updated_at
     FROM users
     WHERE email = ? AND is_deleted = 0
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

/**
 * Find a user by their ID.
 * Used to fetch user profile and other user-related operations.
 * 
 * @param {number} userId - User's ID
 * @returns {Promise<Object|null>} User object if found, null otherwise
 */
async function findUserById(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, name, email, password, role, is_deleted, last_login, created_at, updated_at
     FROM users
     WHERE user_id = ? AND is_deleted = 0
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

/**
 * Create a new user in the database.
 * Used during user registration.
 * 
 * @param {Object} userData - User data object
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - Hashed password
 * @param {string} userData.role - User role ('customer' or 'admin')
 * @returns {Promise<number>} Inserted user ID
 */
async function createUser({ name, email, password, role = "customer" }) {
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, password, role]
  );

  return result.insertId;
}

/**
 * Update user's last login timestamp.
 * Called after successful authentication.
 * 
 * @param {number} userId - User's ID
 * @returns {Promise<void>}
 */
async function updateLastLogin(userId) {
  await pool.query(
    `UPDATE users
     SET last_login = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [userId]
  );
}

/**
 * Update user profile information.
 * Used when user updates their name or other profile details.
 * 
 * @param {number} userId - User's ID
 * @param {Object} updates - Fields to update
 * @param {string} updates.name - Updated name (optional)
 * @returns {Promise<boolean>} True if update was successful
 */
async function updateUserProfile(userId, updates) {
  const { name } = updates;

  if (!name) {
    return false;
  }

  const [result] = await pool.query(
    `UPDATE users
     SET name = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [name, userId]
  );

  return result.affectedRows > 0;
}

/**
 * Soft delete a user (mark as deleted).
 * This preserves data integrity while removing user from active use.
 * 
 * @param {number} userId - User's ID
 * @returns {Promise<boolean>} True if deletion was successful
 */
async function softDeleteUser(userId) {
  const [result] = await pool.query(
    `UPDATE users
     SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [userId]
  );

  return result.affectedRows > 0;
}

export {
  findUserByEmail,
  findUserById,
  createUser,
  updateLastLogin,
  updateUserProfile,
  softDeleteUser
};
