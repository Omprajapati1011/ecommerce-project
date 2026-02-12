import express from "express";

import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem

} from "../controllers/cart.controller.js";

import { auth } from "../middlewares/auth.middleware.js";

import { validateCart, validateCartItemOwnership } from "../middlewares/cart.middleware.js";


const router = express.Router();


// All cart routes require authentication

// User ID is extracted from JWT token instead of URL parameter


/** 

 * Get current user's cart

 * GET /api/cart

 * Headers: Authorization: Bearer <token>

 */

router.get("/", auth, validateCart, getCart);


/** 

 * Add item to cart (add quantity if already present)

 * POST /api/cart/items

 * Headers: Authorization: Bearer <token>

 * Body: { productId, quantity, portionId?, modifierId? }

 */

router.post("/items", auth, validateCart, addItemToCart);


/** 

 * Update quantity for a specific cart item (0 = remove)

 * PATCH /api/cart/items/:cartItemId

 * Headers: Authorization: Bearer <token>

 * Body: { quantity }

 */

router.patch("/items/:cartItemId", auth, validateCart, validateCartItemOwnership, updateCartItem);


/** 

 * Remove a cart item

 * DELETE /api/cart/items/:cartItemId

 * Headers: Authorization: Bearer <token>

 */

router.delete("/items/:cartItemId", auth, validateCart, validateCartItemOwnership, removeCartItem);


export default router;
