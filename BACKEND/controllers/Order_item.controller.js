import {
  Orders,
  OrdersItems,
  countOrderItems,
} from "../models/Order_items.model.js";

import {
  notFound,
  serverError,
  ok,
  created,
  paginated,
} from "../utils/apiResponse.js";

// Retrieve all items for a specific order by order ID with pagination
export const getAllOrderItem = async (req, res) => {
  try {
    const order_id = req.params.orderId;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 5);
    const offset = (page - 1) * limit;

    const total = await countOrderItems(order_id);
    const allOrder = await Orders(order_id, limit, offset);

    // Always return paginated response, even if empty, to update frontend metadata
    return paginated(
      res,
      allOrder.length > 0 ? "Items found Successfully" : "No items found",
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      allOrder,
    );
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
};

// Retrieve a single order item by order ID and item ID
export const getOneItem = async (req, res) => {
  try {
    const order_Id = req.params.orderId;
    const item_Id = req.params.itemId;
    const singleItem = await OrdersItems(order_Id, item_Id);
    if (!singleItem || singleItem.length == 0)
      return notFound(res, "Item not found");
    return ok(res, "Item found seccessfully", singleItem);
  } catch (error) {
    return serverError(res);
  }
};
