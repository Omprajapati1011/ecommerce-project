/**
 * User Controller
 * 
 * This module handles HTTP requests for user authentication and profile management.
 * Implements business logic for registration, login, and profile operations.
 * 
 * @module controllers/user.controller
 * @author Backend Team
 * @collaborators 8-person team
 */

import {
  findUserByEmail,
  findUserById,
  createUser,
  updateLastLogin,
  updateUserProfile,
  softDeleteUser
} from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import {
  ok,
  created,
  badRequest,
  unauthorized,
  notFound,
  serverError
} from "../utils/apiResponse.js";

/**
 * User Registration (Signup)
 * 
 * Creates a new user account with email and password.
 * Validates input, checks for existing users, hashes password, and returns JWT token.
 * 
 * POST /api/auth/register
 * Body: { name, email, password }
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @example
 * POST /api/auth/register
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "securePassword123"
 * }
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return badRequest(res, "Name, email, and password are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return badRequest(res, "Invalid email format");
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return badRequest(res, "Password must be at least 6 characters long");
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return badRequest(res, "User with this email already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const userId = await createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "customer"
    });

    // Generate JWT token
    const token = generateToken({
      userId,
      email: email.toLowerCase().trim(),
      role: "customer"
    });

    // Return success response with token
    return created(res, "User registered successfully", {
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: "customer",
      token
    });
  } catch (error) {
    console.error("Error in register:", error);
    return serverError(res, "Internal server error during registration");
  }
}

/**
 * User Login
 * 
 * Authenticates a user with email and password.
 * Validates credentials, updates last login, and returns JWT token.
 * 
 * POST /api/auth/login
 * Body: { email, password }
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @example
 * POST /api/auth/login
 * {
 *   "email": "john@example.com",
 *   "password": "securePassword123"
 * }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return badRequest(res, "Email and password are required");
    }

    // Find user by email
    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return unauthorized(res, "Invalid email or password");
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return unauthorized(res, "Invalid email or password");
    }

    // Update last login timestamp
    await updateLastLogin(user.user_id);

    // Generate JWT token
    const token = generateToken({
      userId: user.user_id,
      email: user.email,
      role: user.role
    });

    // Return success response with token and user data
    return ok(res, "Login successful", {
      userId: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.last_login,
      token
    });
  } catch (error) {
    console.error("Error in login:", error);
    return serverError(res, "Internal server error during login");
  }
}

/**
 * Get Current User Profile
 * 
 * Returns the authenticated user's profile information.
 * Requires valid JWT token in Authorization header.
 * 
 * GET /api/users/me
 * Headers: Authorization: Bearer <token>
 * 
 * @param {Object} req - Express request object (contains req.user from authMiddleware)
 * @param {Object} res - Express response object
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.userId;

    // Fetch user details
    const user = await findUserById(userId);

    if (!user) {
      return notFound(res, "User not found");
    }

    // Return user profile (excluding password)
    return ok(res, "Profile retrieved successfully", {
      userId: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return serverError(res, "Internal server error");
  }
}

/**
 * Update User Profile
 * 
 * Updates the authenticated user's profile information.
 * Currently supports updating name only.
 * 
 * PATCH /api/users/me
 * Headers: Authorization: Bearer <token>
 * Body: { name }
 * 
 * @param {Object} req - Express request object (contains req.user from authMiddleware)
 * @param {Object} res - Express response object
 * 
 * @example
 * PATCH /api/users/me
 * {
 *   "name": "John Updated"
 * }
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    // Validate input
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return badRequest(res, "Name is required and must be a non-empty string");
    }

    // Update user profile
    const updated = await updateUserProfile(userId, { name: name.trim() });

    if (!updated) {
      return notFound(res, "User not found or update failed");
    }

    // Fetch updated user data
    const user = await findUserById(userId);

    return ok(res, "Profile updated successfully", {
      userId: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return serverError(res, "Internal server error");
  }
}

/**
 * Delete User Account
 * 
 * Soft deletes the authenticated user's account.
 * This action is irreversible for the user.
 * 
 * DELETE /api/users/me
 * Headers: Authorization: Bearer <token>
 * 
 * @param {Object} req - Express request object (contains req.user from authMiddleware)
 * @param {Object} res - Express response object
 */
async function deleteAccount(req, res) {
  try {
    const userId = req.user.userId;

    // Soft delete user
    const deleted = await softDeleteUser(userId);

    if (!deleted) {
      return notFound(res, "User not found or already deleted");
    }

    return ok(res, "Account deleted successfully");
  } catch (error) {
    console.error("Error in deleteAccount:", error);
    return serverError(res, "Internal server error");
  }
}

export {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount
};
