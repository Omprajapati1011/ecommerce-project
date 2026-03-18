import {
  getCart,
  getCompareProductCategory,
  getUserAddress,
  insertValue,
  getAllOrder,
  getPortionPrice,
  getPortionValue,
  getOfferOnCart,
  getOfferItem,
  getProducts,
  getRootCategoryId,
  getModifierValue,
  getOfferOnId,
  getOfferDetails,
  setOrderDeleted,
  getAllOrdersAdmin as modelGetAllOrdersAdmin,
  getAllItemsByCountAdmin as modelGetAllItemsByCountAdmin,
  getOrderById,
  updateOrderStatusWithTransition,
  countAllOrder,
  countAllOrdersAdmin,
  getAllItemsAdmin as modelGetAllItemsAdmin,
  findAllOrdersAdmin,
  getOrderDetailAdmin as modelGetOrderDetail,
  updatePaymentStatusAdmin as modelUpdatePaymentStatus,
  createCancelRequest,
  getCancelRequestsAdmin,
  reviewCancelRequest,
  getLatestCancelRequestForOrder,
} from "../models/Order_master.model.js";
import { insertQuery } from "../models/Order_items.model.js";

import {
  badRequest,
  notFound,
  ok,
  serverError,
  created,
  paginated,
} from "../utils/apiResponse.js";

const DEFAULT_ORDER_PAGE = 1;
const DEFAULT_ORDER_LIMIT = 5;
const MAX_ORDER_LIMIT = 50;
const DEFAULT_ORDER_SORT_FIELD = "created_at";
const DEFAULT_ORDER_SORT_ORDER = "DESC";

// Create a new order from user's cart with tax, discounts, and shipping calculations
export const Order_master = async (req, res) => {
  const user_id = req.user.id;
  const paymentMethod = String(
    req.body?.payment_method || "cash_on_delivery",
  ).toLowerCase();

  try {
    if (!["cash_on_delivery", "stripe"].includes(paymentMethod)) {
      return badRequest(res, "Please choose a valid payment method.");
    }

    const summary = await calculateOrderValues(user_id);

    const address_id = await getUserAddress(user_id);
    const totalAmount = summary.finalAmount + summary.shipping_amount;

    const values = [
      "ORD",
      user_id,
      address_id,
      summary.totalPrice,
      summary.totalTax,
      summary.shipping_amount,
      summary.totalDisCount,
      totalAmount,
      "pending",
      paymentMethod === "stripe" ? "processing" : "pending",
      0,
      user_id,
      user_id,
    ];

    const insert = await insertValue(values);
    const orderId = insert.insertId;

    await postOrderItems(
      user_id,
      orderId,
      summary.price,
      summary.taxAmountArray,
      [],
      summary.cart,
    );

    const createdOrder = await getOrderById(orderId);

    return created(res, "Order created successfully", {
      ...insert,
      order_id: orderId,
      order_number: createdOrder?.order_number || `ORD-${orderId}`,
      total_amount: totalAmount,
      payment_status: paymentMethod === "stripe" ? "processing" : "pending",
      payment_method: paymentMethod,
    });
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};
export const getOrderSummery = async (req, res) => {
  try {
    const user_id = req.user.id;

    const summary = await calculateOrderValues(user_id);
    return ok(res, "Order summary", {
      total_price: summary.totalPrice,
      tax: summary.totalTax,
      discount: summary.totalDisCount,
      shipping: summary.shipping_amount,
      final_amount: summary.finalAmount + summary.shipping_amount,
    });
  } catch (err) {
    if (err?.message === "Cart is empty") {
      return ok(res, "Cart is empty", {
        total_price: 0,
        tax: 0,
        discount: 0,
        shipping: 0,
        final_amount: 0,
      });
    }

    console.error(err);
    return serverError(res);
  }
};
const calculateOrderValues = async (user_id) => {
  const cart = await getCart(user_id);
  if (cart.length === 0) {
    throw new Error("Cart is empty");
  }

  const productsIds = cart.map((item) => item.product_id);
  const products = await getProducts(productsIds);

  const portionIds = cart.map((item) => item.product_portion_id);

  let price = [];

  for (let i = 0; i < portionIds.length; i++) {
    if (portionIds[i] == 0 || portionIds[i] == null) {
      price.push(Number(products[i].price));
      continue;
    }

    const portionPrice = await getPortionPrice(productsIds[i], portionIds[i]);
    price.push(Number(portionPrice[0].price));
  }

  const totalPrice = price.reduce((sum, val) => sum + val, 0);

  /* TAX CALCULATION */

  const rootCategoryEntries = await Promise.all(
    products.map(async (t) => {
      const rootId = await findRootCategory(t.category_id);
      return [t.product_id, rootId];
    }),
  );

  const rootCategoryMap = Object.fromEntries(rootCategoryEntries);

  const taxAmountArray = cart.map((item, index) => {
    const categoryId = rootCategoryMap[item.product_id];
    const taxPercent = getTaxPercent(categoryId);

    return (price[index] * taxPercent) / 100;
  });

  const totalTax = taxAmountArray.reduce((sum, value) => sum + value, 0);

  /* DISCOUNT */

  let totalDisCount = 0;
  let offer_id = null;

  const offerOnCart = await getOfferOnCart(user_id);
  offer_id = offerOnCart[0]?.offer_id || null;

  const findOffer = await getOfferDetails(offer_id);

  if (findOffer.length > 0) {
    if (findOffer[0].discount_type === "percentage") {
      totalDisCount = (totalPrice * Number(findOffer[0].discount_value)) / 100;
    }

    if (findOffer[0].discount_type === "fixed_amount") {
      totalDisCount = Number(findOffer[0].discount_value);
    }
  }

  const finalAmount = totalPrice + totalTax - totalDisCount;

  let shipping_amount = 50;
  if (finalAmount > 500) shipping_amount = 0;

  return {
    cart,
    price,
    taxAmountArray,
    totalPrice,
    totalTax,
    totalDisCount,
    finalAmount,
    shipping_amount,
  };
};
// Retrieve all orders for a user with pagination
export const AllOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    // Pagination parsing
    const page = Math.max(
      DEFAULT_ORDER_PAGE,
      parseInt(req.query.page) || DEFAULT_ORDER_PAGE,
    );
    const limit = Math.min(
      MAX_ORDER_LIMIT,
      parseInt(req.query.limit) || DEFAULT_ORDER_LIMIT,
    );
    const offset = (page - 1) * limit;
    const sortField = req.query.sortField || DEFAULT_ORDER_SORT_FIELD;
    const sortOrder =
      String(req.query.sortOrder || DEFAULT_ORDER_SORT_ORDER).toUpperCase() ===
      "ASC"
        ? "ASC"
        : DEFAULT_ORDER_SORT_ORDER;

    const total = await countAllOrder(userId);
    const orders = await getAllOrder(
      userId,
      limit,
      offset,
      sortField,
      sortOrder,
    );

    // Always return paginated response, even if empty, to update frontend metadata
    return paginated(
      res,
      orders.length > 0 ? "Orders found Successfully" : "No orders found",
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      orders,
    );
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
};

// Retrieve a specific order by order ID

// Create order item records for each product in the order
export const postOrderItems = async (
  userId,
  orderId,
  price,
  taxAmountArray,
  totalDisCountArray,
  cart,
) => {
  const cart_id = cart[0]?.cart_id;
  // Extract product IDs from cart
  const productIds = cart.map((item) => item.product_id);
  let offer_id = null;
  offer_id = totalDisCountArray[0]?.offer_id || null;

  // Fetch primary category for each product
  const productCategories = await getCompareProductCategory(productIds);
  const categoryIds = productCategories.map((item) => item.category_id);
  
  // Collect all modifier IDs across all cart items
  const allModifierIds = [];
  cart.forEach((item) => {
    if (item.modifier_ids && item.modifier_ids.length > 0) {
      allModifierIds.push(...item.modifier_ids);
    }
  });
  const uniqueModifierIds = [...new Set(allModifierIds)];

  const portionIds = cart.map((item) => item.product_portion_id);
  const portionRows = await getPortionValue(portionIds);
  const modifierRows = uniqueModifierIds.length > 0 ? await getModifierValue(uniqueModifierIds) : [];
  const quantities = cart.map((item) => item.quantity);
  const portionMap = Object.fromEntries(
    portionRows.map((p) => [p.portion_id, p.portion_value]),
  );

  const modifierMap = {};
  modifierRows.forEach(m => {
     modifierMap[m.modifier_id] = m;
  });

  // Fetch product names
  const values = [];
  const products = await getProducts(productIds);
  // Create map of product IDs to names
  const productMap = Object.fromEntries(
    products.map((p) => [p.product_id, p.name]),
  );

  if (!totalDisCountArray || totalDisCountArray.length === 0) {
    totalDisCountArray = new Array(cart.length).fill(0);
  }

  const modifiersMapping = [];

  // Build order item records with calculated totals
  for (let i = 0; i < cart.length; i++) {
    // Apply shipping charges based on item price
    let shippingAmount = 100;
    if (price[i] > 100) shippingAmount = 0;
    // Calculate final total for this order item
    const p = isNaN(price[i]) ? 0 : Number(price[i]);
    const t = isNaN(taxAmountArray[i]) ? 0 : Number(taxAmountArray[i]);
    const d = Number(totalDisCountArray[i]?.offer_id) || 0;
    const finalTotal = p + t - d;

    const itemModifiers = cart[i].modifier_ids || [];
    const itemModifierObjects = itemModifiers.map(id => modifierMap[id]).filter(Boolean);
    const primaryModifierId = itemModifierObjects.length > 0 ? itemModifierObjects[0].modifier_id : null;
    const primaryModifierValue = itemModifierObjects.length > 0 ? itemModifierObjects[0].modifier_value : null;

    modifiersMapping.push(itemModifierObjects);

    // Prepare order item data
    const value = [
      orderId,
      productIds[i],
      portionIds[i],
      primaryModifierId,
      productMap[productIds[i]] || null,
      portionMap[portionIds[i]] || null,
      primaryModifierValue,
      quantities[i],
      p,
      d,
      t,
      finalTotal,
      userId,
      userId,
    ];
    values.push(value);
  }
  // Insert all order items into database
  await insertQuery(values, cart_id, orderId, modifiersMapping);
};

// Find root category ID for tax calculation
const findRootCategory = async (categoryId) => {
  const rows = await getRootCategoryId(categoryId);
  return rows[0]?.category_id;
};

// Get tax percentage based on root category
const getTaxPercent = (rootCategoryId) => {
  const TAX_RULES = {
    1: 18,
    27: 5,
  };
  return TAX_RULES[rootCategoryId] || 0;
};
export const changeOrderStatusByAdmin = async (req, res) => {
  try {
    const latestStatus = req.body.latestStatus;
    const order_id = req.params.id;

    if (!latestStatus || !ALLOWED_STATUSES.has(latestStatus)) {
      return badRequest(res, "Please choose a valid order status.");
    }

    const result = await updateOrderStatusWithTransition(
      order_id,
      latestStatus,
      req.user.id,
      null,
    );

    if (result && result.reason === "INVALID_STATUS")
      return badRequest(res, "Please choose a valid order status.");
    if (result && result.reason === "NOT_FOUND")
      return notFound(res, "Order not found");
    if (result && result.reason === "INVALID_TRANSITION")
      return badRequest(res, "This order cannot be moved to that status yet.");

    if (!result || result.affectedRows === 0)
      return notFound(res, "Order not found or no change applied");

    return ok(res, "Order status updated successfully", result);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order_id = req.params.id;
    const rows = await setOrderDeleted(order_id);
    return ok(res, "order deleted Successfully", rows);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order_id = req.params.id;
    const order = await getOrderById(order_id);
    if (!order) return notFound(res, "Order not found");

    if (order.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You do not have permission to cancel this order." });
    }

    if (!USER_CANCELABLE_STATUSES.has(order.order_status)) {
      return badRequest(res, "This order can no longer be cancelled.");
    }

    const result = await updateOrderStatusWithTransition(
      order_id,
      "cancelled",
      req.user.id,
      req.user.id,
    );

    if (result && result.reason === "NOT_OWNER")
      return res
        .status(403)
        .json({ message: "You do not have permission to do that." });
    if (result && result.reason === "INVALID_TRANSITION")
      return badRequest(res, "This order cannot be cancelled right now.");
    if (result && result.reason === "NOT_FOUND")
      return notFound(res, "Order not found");

    if (!result || result.affectedRows === 0)
      return serverError(res, "Failed to cancel order");

    return ok(res, "Order cancelled successfully", result);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const returnOrderByUser = async (req, res) => {
  try {
    const order_id = req.params.id;
    const order = await getOrderById(order_id);
    if (!order) return notFound(res, "Order not found");

    if (order.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You do not have permission to return this order." });
    }

    if (order.order_status !== "delivered") {
      return badRequest(res, "Only delivered orders can be returned.");
    }

    const result = await updateOrderStatusWithTransition(
      order_id,
      "returned",
      req.user.id,
      req.user.id,
    );

    if (result && result.reason === "INVALID_TRANSITION")
      return badRequest(res, "This order cannot be returned right now.");
    if (result && result.reason === "NOT_FOUND")
      return notFound(res, "Order not found");
    if (!result || result.affectedRows === 0)
      return serverError(res, "Failed to mark order as returned");

    return ok(res, "Order return processed successfully", result);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const getAllOrderByAdmin = async (req, res) => {
  try {
    const page = Math.max(
      DEFAULT_ORDER_PAGE,
      parseInt(req.query.page) || DEFAULT_ORDER_PAGE,
    );
    const limit = Math.min(
      MAX_ORDER_LIMIT,
      parseInt(req.query.limit) || DEFAULT_ORDER_LIMIT,
    );
    const offset = (page - 1) * limit;
    const sortField = req.query.sortField || "created_at";
    const sortOrder =
      String(req.query.sortOrder || "DESC").toUpperCase() === "ASC"
        ? "asc"
        : "desc";

    const filters = {
      search: req.query.search || undefined,
      order_status: req.query.status || undefined,
    };

    const result = await findAllOrdersAdmin(filters, {
      limit,
      offset,
      sortField,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: "all orders fetched successfully",
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: result.total,
        totalPages: Math.ceil(result.total / limit) || 1,
        hasNextPage: page < Math.ceil(result.total / limit),
        hasPrevPage: page > 1,
      },
      stats: result.stats,
      data: result.data,
    });
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const requestCancelOrderByUser = async (req, res) => {
  try {
    const order_id = req.params.id;
    const order = await getOrderById(order_id);

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          message:
            "You do not have permission to request cancellation for this order.",
        });
    }

    if (!USER_CANCELABLE_STATUSES.has(order.order_status)) {
      return badRequest(
        res,
        "This order cannot accept a cancellation request right now.",
      );
    }

    const latestRequest = await getLatestCancelRequestForOrder(order_id);
    if (
      latestRequest &&
      latestRequest.user_id === req.user.id &&
      String(latestRequest.status).toLowerCase() === "pending"
    ) {
      return badRequest(
        res,
        "A cancellation request for this order is already pending.",
      );
    }

    const result = await createCancelRequest({
      orderId: order_id,
      userId: req.user.id,
      reason: req.body?.reason || null,
    });

    if (result.reason === "ALREADY_PENDING") {
      return badRequest(res, "Cancellation request is already pending");
    }

    return created(
      res,
      "Cancellation request submitted successfully",
      result.data,
    );
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const getOrderDetailByAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await modelGetOrderDetail(orderId);

    if (!order) {
      return notFound(res, "Order not found");
    }

    return ok(res, "Order fetched successfully", order);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const getCancelRequestsByAdmin = async (req, res) => {
  try {
    const requests = await getCancelRequestsAdmin({
      status: req.query.status || undefined,
      limit: req.query.limit || 100,
    });

    return ok(res, "Cancellation requests fetched successfully", {
      pendingCount: requests.filter(
        (item) => String(item.status).toLowerCase() === "pending",
      ).length,
      requests,
    });
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const reviewCancelRequestByAdmin = async (req, res) => {
  try {
    const requestId = req.params.id;
    const action = req.body?.action;
    const adminNote = req.body?.admin_note || null;

    const result = await reviewCancelRequest({
      requestId,
      action,
      reviewedBy: req.user.id,
      adminNote,
    });

    if (result.reason === "INVALID_ACTION") {
      return badRequest(res, "Invalid review action");
    }
    if (result.reason === "NOT_FOUND") {
      return notFound(res, "Cancellation request not found");
    }
    if (result.reason === "ALREADY_REVIEWED") {
      return badRequest(
        res,
        "This cancellation request has already been reviewed.",
      );
    }
    if (result.reason === "ORDER_NOT_CANCELABLE") {
      return badRequest(
        res,
        "This order can no longer be cancelled, so the request cannot be approved.",
      );
    }

    return ok(
      res,
      action === "approve"
        ? "Cancellation request approved successfully"
        : "Cancellation request rejected successfully",
      result,
    );
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const getAllItemsByCountAdmin = async (req, res) => {
  try {
    const rows = await modelGetAllItemsByCountAdmin();
    return ok(res, "all item by count fetched successfully", rows);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

export const getAllItemsAdmin = async (req, res) => {
  try {
    const rows = await modelGetAllItemsAdmin();
    return ok(res, "all items fetched seccessfully", rows);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

const ALLOWED_STATUSES = new Set([
  "pending",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "returned",
]);

const ALLOWED_PAYMENT_STATUSES = new Set([
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
]);

export const changePaymentStatusByAdmin = async (req, res) => {
  try {
    const paymentStatus = req.body.paymentStatus;
    const order_id = req.params.id;

    if (!paymentStatus || !ALLOWED_PAYMENT_STATUSES.has(paymentStatus)) {
      return badRequest(res, "Please choose a valid payment status.");
    }

    const result = await modelUpdatePaymentStatus(
      order_id,
      paymentStatus,
      req.user.id,
    );

    if (result && result.reason === "INVALID_STATUS") {
      return badRequest(res, "Please choose a valid payment status.");
    }
    if (result && result.reason === "INVALID_TRANSITION") {
      return badRequest(
        res,
        "This payment cannot be moved to that status yet.",
      );
    }
    if (result && result.reason === "STRIPE_MANAGED") {
      return badRequest(
        res,
        "Stripe payment updates are handled automatically, so this status is view-only.",
      );
    }
    if (result && result.reason === "COD_NOT_DELIVERED") {
      return badRequest(
        res,
        "Cash on delivery payments can only be completed after delivery",
      );
    }
    if (result && result.reason === "INVALID_REFUND_STATE") {
      return badRequest(
        res,
        "Only delivered, completed, cancelled, or refunded orders can be refunded",
      );
    }

    if (!result || result.affectedRows === 0) {
      return notFound(res, "Order not found or no change applied");
    }

    return ok(res, "Payment status updated successfully", result);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

const USER_CANCELABLE_STATUSES = new Set(["pending", "processing"]);
