import { getOrCreateCartByUserId, getCartItemsWithProduct } from "../models/cart.model.js";

/**
 * Middleware to validate cart exists and belongs to the authenticated user
 * Attaches cart to req.cart for use in subsequent handlers
 */
export async function validateCart(req, res, next) {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const cart = await getOrCreateCartByUserId(userId);
    req.cart = cart;

    next();
  } catch (error) {
    console.error("Error in validateCart middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

/**
 * Middleware to validate cart item belongs to the user's cart
 * Must be used after validateCart middleware
 */
export async function validateCartItemOwnership(req, res, next) {
  try {
    const { cartItemId } = req.params;
    const userId = req.user.userId;
    const cart = req.cart;

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const items = await getCartItemsWithProduct(cart.cart_id);
    const item = items.find((i) => i.cart_item_id === parseInt(cartItemId));

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found for this user"
      });
    }

    req.cartItem = item;
    next();
  } catch (error) {
    console.error("Error in validateCartItemOwnership middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
