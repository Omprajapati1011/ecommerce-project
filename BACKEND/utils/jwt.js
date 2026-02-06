/**
 * JWT Utility Functions
 * 
 * This module provides JWT token generation and verification for user authentication.
 * Tokens are used to authenticate API requests and maintain user sessions.
 * 
 * @module utils/jwt
 * @author Backend Team
 * @collaborators 8-person team
 */

import jwt from "jsonwebtoken";

/**
 * JWT secret key from environment variables.
 * Must be set in .env file for production.
 */
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Token expiration time.
 * Access tokens expire in 24 hours for better security.
 */
const TOKEN_EXPIRY = "24h";

/**
 * Generate a JWT token for a user.
 * 
 * @param {Object} payload - User data to encode in token (userId, email, role)
 * @returns {string} JWT token
 * 
 * @example
 * const token = generateToken({ userId: 1, email: 'user@example.com', role: 'customer' });
 */
function generateToken(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload: must be an object");
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY
  });
}

/**
 * Verify and decode a JWT token.
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded payload if valid, null if invalid
 * 
 * @example
 * const decoded = verifyToken(token);
 * if (decoded) {
 *   console.log(decoded.userId); // Access user data
 * }
 */
function verifyToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

export { generateToken, verifyToken };
