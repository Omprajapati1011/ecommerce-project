/**
 * Authentication Middleware
 * 
 * This middleware validates JWT tokens and protects routes that require authentication.
 * It extracts the token from the Authorization header and verifies it.
 * 
 * Usage:
 * - Apply to routes that require user authentication
 * - Adds decoded user data to req.user for use in controllers
 * 
 * @module middlewares/authMiddleware
 * @author Backend Team
 * @collaborators 8-person team
 */

import { verifyToken } from "../utils/jwt.js";

/**
 * Middleware to authenticate requests using JWT tokens.
 * 
 * Expected header format: Authorization: Bearer <token>
 * 
 * If token is valid:
 * - Sets req.user with decoded user data (userId, email, role)
 * - Calls next() to proceed to the next middleware/controller
 * 
 * If token is invalid or missing:
 * - Returns 401 Unauthorized response
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * router.get('/profile', authMiddleware, userProfileController);
 */
function authMiddleware(req, res, next) {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // Verify the token
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again."
    });
  }

  // Attach decoded user data to request object
  req.user = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role
  };

  // Proceed to next middleware/controller
  next();
}

/**
 * Middleware to check if user has admin role.
 * Must be used after authMiddleware.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * router.delete('/users/:id', authMiddleware, adminOnly, deleteUserController);
 */
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    });
  }
  next();
}

export { authMiddleware, adminOnly };
