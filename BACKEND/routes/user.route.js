/**
 * User Routes
 * 
 * This module defines all API routes for user authentication and profile management.
 * Routes are organized by functionality (auth, profile) and protected by middleware.
 * 
 * Base path: /api
 * 
 * @module routes/user.route
 * @author Backend Team
 * @collaborators 8-person team
 */

import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount
} from "../controllers/user.controller.js";
import { authMiddleware, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =====================
// Authentication Routes
// =====================

/**
 * User Registration (Signup)
 * POST /api/auth/register
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * Response (201):
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "userId": 4,
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "customer",
 *     "token": "eyJhbGciOiJIUzI1NiIs..."
 *   }
 * }
 */
router.post("/auth/register", register);

/**
 * User Login
 * POST /api/auth/login
 * 
 * Request body:
 * {
 *   "email": "john@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "userId": 4,
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "customer",
 *     "lastLogin": "2026-02-06T10:30:00.000Z",
 *     "token": "eyJhbGciOiJIUzI1NiIs..."
 *   }
 * }
 */
router.post("/auth/login", login);

// =====================
// User Profile Routes
// =====================

/**
 * Get Current User Profile
 * GET /api/users/me
 * 
 * Headers:
 * Authorization: Bearer <token>
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "userId": 4,
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "customer",
 *     "lastLogin": "2026-02-06T10:30:00.000Z",
 *     "createdAt": "2026-02-06T09:00:00.000Z",
 *     "updatedAt": "2026-02-06T09:00:00.000Z"
 *   }
 * }
 */
router.get("/users/me", authMiddleware, getProfile);

/**
 * Update User Profile
 * PATCH /api/users/me
 * 
 * Headers:
 * Authorization: Bearer <token>
 * 
 * Request body:
 * {
 *   "name": "John Updated"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Profile updated successfully",
 *   "data": {
 *     "userId": 4,
 *     "name": "John Updated",
 *     "email": "john@example.com",
 *     "role": "customer",
 *     "updatedAt": "2026-02-06T11:00:00.000Z"
 *   }
 * }
 */
router.patch("/users/me", authMiddleware, updateProfile);

/**
 * Delete User Account
 * DELETE /api/users/me
 * 
 * Headers:
 * Authorization: Bearer <token>
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Account deleted successfully"
 * }
 */
router.delete("/users/me", authMiddleware, deleteAccount);

export default router;
