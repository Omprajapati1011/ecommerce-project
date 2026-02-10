import {
  getOrCreateCartByUserId,
  getCartItemsWithProduct,
  findCartItem,
  insertCartItem,
  updateCartItemQuantity,
  deleteCartItem,
  getProductPricing
} from "../models/cart.model.js";
import {
  ok,
  created,
  badRequest,
  unauthorized,
  notFound,
  serverError
} from "../utils/apiResponse.js";

/**
 * Parse and validate positive integer values
 * @param {string|number} value - Value to parse
 * @returns {number|null} Parsed integer or null if invalid
 */
function parsePositiveInt(value) {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) {
    return null;
  }
  return num;
}

/**
 * Build cart response object with totals
 * @param {number} cartId - Cart ID
 * @param {Array} items - Cart items with product details
 * @returns {Object} Cart response with items, subtotal, discount, total
 */
function buildCartResponse(cartId, items) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  // Offer / coupon support can adjust these later
  const discount = 0;
  const total = subtotal - discount;

  return {
    cartId,
    items: items.map((item) => ({
      cartItemId: item.cart_item_id,
      productId: item.product_id,
      productName: item.display_name,
      shortDescription: item.short_description,
      quantity: item.quantity,
      price: Number(item.price),
      lineTotal: Number(item.price) * item.quantity
    })),
    subtotal,
    discount,
    total,
    appliedCoupon: null
  };
}

/**
 * Get current user's cart
 * Requires authentication (userId from JWT token)
 * 
 * GET /api/cart
 * Headers: Authorization: Bearer <token>
 */
async function getCart(req, res) {
  try {
    // User ID comes from JWT token (authMiddleware)
    const userId = req.user.userId;

    if (!userId) {
      return unauthorized(res, "User authentication required");
    }

    const cart = await getOrCreateCartByUserId(userId);
    const items = await getCartItemsWithProduct(cart.cart_id);

    const response = buildCartResponse(cart.cart_id, items);
    return ok(res, "Cart retrieved successfully", response);
  } catch (err) {
    console.error("Error in getCart:", err);
    return serverError(res, "Internal server error");
  }
}

/**
 * Add item to cart (add quantity if already present)
 * Requires authentication (userId from JWT token)
 * 
 * POST /api/cart/items
 * Headers: Authorization: Bearer <token>
 * Body: { productId, quantity }
 */
async function addItemToCart(req, res) {
  try {
    // User ID comes from JWT token (authMiddleware)
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (!userId) {
      return unauthorized(res, "User authentication required");
    }

    const parsedProductId = parsePositiveInt(productId);
    const parsedQuantity = parsePositiveInt(quantity);

    if (!parsedProductId || !parsedQuantity) {
      return badRequest(res, "Invalid productId or quantity");
    }

    const pricing = await getProductPricing(parsedProductId);

    if (!pricing) {
      return notFound(res, "Product not found or inactive");
    }

    const cart = await getOrCreateCartByUserId(userId);

    const existingItem = await findCartItem(cart.cart_id, parsedProductId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + parsedQuantity;
      await updateCartItemQuantity(existingItem.cart_item_id, newQuantity);
    } else {
      await insertCartItem({
        cartId: cart.cart_id,
        productId: parsedProductId,
        quantity: parsedQuantity,
        price: pricing.price
      });
    }

    const items = await getCartItemsWithProduct(cart.cart_id);
    const response = buildCartResponse(cart.cart_id, items);

    return created(res, "Item added to cart", response);
  } catch (err) {
    console.error("Error in addItemToCart:", err);
    return serverError(res, "Internal server error");
  }
}

/**
 * Update quantity for a specific cart item (0 = remove)
 * Requires authentication (userId from JWT token)
 * 
 * PATCH /api/cart/items/:cartItemId
 * Headers: Authorization: Bearer <token>
 * Body: { quantity }
 */
async function updateCartItem(req, res) {
  try {
    // User ID comes from JWT token (authMiddleware)
    const userId = req.user.userId;
    const cartItemId = parsePositiveInt(req.params.cartItemId);
    const { quantity } = req.body;

    if (!userId) {
      return unauthorized(res, "User authentication required");
    }

    if (!cartItemId) {
      return badRequest(res, "Invalid cartItemId");
    }

    const parsedQuantity = parsePositiveInt(quantity);

    if (parsedQuantity === null) {
      return badRequest(res, "Invalid quantity");
    }

    // Ensure the item belongs to the user's cart
    const cart = await getOrCreateCartByUserId(userId);
    const items = await getCartItemsWithProduct(cart.cart_id);
    const item = items.find((i) => i.cart_item_id === cartItemId);

    if (!item) {
      return notFound(res, "Cart item not found for this user");
    }

    if (parsedQuantity === 0) {
      await deleteCartItem(cartItemId);
    } else {
      await updateCartItemQuantity(cartItemId, parsedQuantity);
    }

    const updatedItems = await getCartItemsWithProduct(cart.cart_id);
    const response = buildCartResponse(cart.cart_id, updatedItems);

    return ok(res, "Cart item updated", response);
  } catch (err) {
    console.error("Error in updateCartItem:", err);
    return serverError(res, "Internal server error");
  }
}

/**
 * Remove a cart item
 * Requires authentication (userId from JWT token)
 * 
 * DELETE /api/cart/items/:cartItemId
 * Headers: Authorization: Bearer <token>
 */
async function removeCartItem(req, res) {
  try {
    // User ID comes from JWT token (authMiddleware)
    const userId = req.user.userId;
    const cartItemId = parsePositiveInt(req.params.cartItemId);

    if (!userId) {
      return unauthorized(res, "User authentication required");
    }

    if (!cartItemId) {
      return badRequest(res, "Invalid cartItemId");
    }

    // Ensure the item belongs to the user's cart
    const cart = await getOrCreateCartByUserId(userId);
    const items = await getCartItemsWithProduct(cart.cart_id);
    const item = items.find((i) => i.cart_item_id === cartItemId);

    if (!item) {
      return notFound(res, "Cart item not found for this user");
    }

    await deleteCartItem(cartItemId);

    const updatedItems = await getCartItemsWithProduct(cart.cart_id);
    const response = buildCartResponse(cart.cart_id, updatedItems);

    return ok(res, "Cart item removed", response);
  } catch (err) {
    console.error("Error in removeCartItem:", err);
    return serverError(res, "Internal server error");
  }
}

export { getCart, addItemToCart, updateCartItem, removeCartItem };
