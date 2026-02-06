import express from "express";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem
} from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All cart routes require authentication
// User ID is extracted from JWT token instead of URL parameter

/**
 * Get current user's cart
 * GET /api/cart
 * Headers: Authorization: Bearer <token>
 */
router.get("/", authMiddleware, getCart);

/**
 * Add item to cart (add quantity if already present)
 * POST /api/cart/items
 * Headers: Authorization: Bearer <token>
 * Body: { productId, quantity }
 */
router.post("/items", authMiddleware, addItemToCart);

/**
 * Update quantity for a specific cart item (0 = remove)
 * PATCH /api/cart/items/:cartItemId
 * Headers: Authorization: Bearer <token>
 * Body: { quantity }
 */
router.patch("/items/:cartItemId", authMiddleware, updateCartItem);

/**
 * Remove a cart item
 * DELETE /api/cart/items/:cartItemId
 * Headers: Authorization: Bearer <token>
 */
router.delete("/items/:cartItemId", authMiddleware, removeCartItem);

export default router;
