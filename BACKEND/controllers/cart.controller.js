import {

  getOrCreateCartByUserId,

  getCartItemsWithProduct,

  findCartItem,

  insertCartItem,

  updateCartItemQuantity,

  deleteCartItem,

  getProductPricing,

  getPortionPricing,

  getModifierPricing,

  getFirstAvailablePortion

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

    (sum, item) => sum + Number(item.effective_price) * item.quantity,

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

      price: Number(item.effective_price),

      lineTotal: Number(item.effective_price) * item.quantity,

      portionPrice: item.portion_price ? Number(item.portion_price) : null,

      portionDiscountedPrice: item.portion_discounted_price ? Number(item.portion_discounted_price) : null,

      portionId: item.portion_id,

      portionValue: item.portion_value,

      modifierId: item.modifier_id,

      modifierName: item.modifier_name,

      modifierValue: item.modifier_value

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

    // Cart is attached by validateCart middleware
    const items = await getCartItemsWithProduct(req.cart.cart_id);



    const response = buildCartResponse(req.cart.cart_id, items);

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

 * Body: { productId, quantity, portionId?, modifierId? }

 */

async function addItemToCart(req, res) {

  try {

    // User ID comes from JWT token (authMiddleware)
    const userId = req.user.userId;

    // Cart is attached by validateCart middleware
    const { productId, quantity, portionId, modifierId } = req.body;



    const parsedProductId = parsePositiveInt(productId);

    const parsedQuantity = parsePositiveInt(quantity);

    const parsedPortionId = portionId ? parsePositiveInt(portionId) : null;

    const parsedModifierId = modifierId ? parsePositiveInt(modifierId) : null;



    if (!parsedProductId || !parsedQuantity) {

      return badRequest(res, "Invalid productId or quantity");

    }



    const pricing = await getProductPricing(parsedProductId);



    if (!pricing) {

      return notFound(res, "Product not found or inactive");

    }



    let itemPrice = Number(pricing.price);
    let finalPortionId = parsedPortionId;



    // If portion is provided, validate it. If not, auto-select first available portion
    if (parsedPortionId) {

      const portionPricing = await getPortionPricing(parsedPortionId);

      if (!portionPricing) {

        return badRequest(res, "Invalid portion specified. This portion does not exist or is inactive.");

      }

      itemPrice = Number(portionPricing.price);

    } else {

      // Auto-select first available portion
      const defaultPortion = await getFirstAvailablePortion(parsedProductId);

      if (defaultPortion) {

        finalPortionId = defaultPortion.productPortionId;

        itemPrice = Number(defaultPortion.price);

      } else {

        // If no portion exists, use base product price
        finalPortionId = null;
        itemPrice = Number(pricing.price);
      }

    }



    // If modifier is provided, add modifier's additional price
    if (parsedModifierId) {
      const modifierPricing = await getModifierPricing(parsedModifierId);
      if (!modifierPricing) {
        return badRequest(res, "Invalid modifier specified. This modifier does not exist or is inactive.");
      }
      itemPrice = Math.round((itemPrice + Number(modifierPricing.additionalPrice)) * 1000) / 1000;
    } else {
      itemPrice = Math.round(itemPrice * 1000) / 1000;
    }



    const existingItem = await findCartItem(req.cart.cart_id, parsedProductId, finalPortionId, parsedModifierId);



    if (existingItem) {

      const newQuantity = existingItem.quantity + parsedQuantity;

      await updateCartItemQuantity(existingItem.cart_item_id, newQuantity, userId);

    } else {

      await insertCartItem({

        cartId: req.cart.cart_id,

        productId: parsedProductId,

        quantity: parsedQuantity,

        price: itemPrice,

        productPortionId: finalPortionId,

        modifierId: parsedModifierId,

        userId

      });

    }



    const items = await getCartItemsWithProduct(req.cart.cart_id);

    const response = buildCartResponse(req.cart.cart_id, items);



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

    // Cart and cartItem are attached by middleware
    const cartItem = req.cartItem;

    const { quantity } = req.body;



    const parsedQuantity = parsePositiveInt(quantity);



    if (parsedQuantity === null) {

      return badRequest(res, "Invalid quantity");

    }



    // Cart item ownership is validated by middleware
    const cartItemId = req.cartItem.cart_item_id;



    if (parsedQuantity === 0) {

      await deleteCartItem(cartItemId, userId);

    } else {

      await updateCartItemQuantity(cartItemId, parsedQuantity, userId);

    }



    const updatedItems = await getCartItemsWithProduct(req.cart.cart_id);

    const response = buildCartResponse(req.cart.cart_id, updatedItems);



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

    // Cart item ownership is validated by middleware
    const cartItemId = req.cartItem.cart_item_id;



    await deleteCartItem(cartItemId, userId);



    const updatedItems = await getCartItemsWithProduct(req.cart.cart_id);

    const response = buildCartResponse(req.cart.cart_id, updatedItems);



    return ok(res, "Cart item removed", response);

  } catch (err) {

    console.error("Error in removeCartItem:", err);

    return serverError(res, "Internal server error");

  }

}



export { getCart, addItemToCart, updateCartItem, removeCartItem };

