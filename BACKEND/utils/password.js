/**
 * Password Utility Functions
 * 
 * This module provides secure password hashing and verification using bcrypt.
 * All passwords should be hashed before storing in the database.
 * 
 * @module utils/password
 * @author Backend Team
 * @collaborators 8-person team
 */

import bcrypt from "bcrypt";

/**
 * Salt rounds for bcrypt hashing.
 * Higher is more secure but slower. 10 is a good balance.
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt.
 * 
 * @param {string} plainPassword - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 * 
 * @example
 * const hashedPassword = await hashPassword('user123');
 */
async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== "string") {
    throw new Error("Invalid password: must be a non-empty string");
  }

  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password.
 * 
 * @param {string} plainPassword - Plain text password from user input
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * 
 * @example
 * const isValid = await comparePassword('user123', hashedPassword);
 */
async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(plainPassword, hashedPassword);
}

export { hashPassword, comparePassword };
