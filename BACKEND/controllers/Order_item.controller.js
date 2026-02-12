import { Orders,OrdersItems } from "../models/Order_items.model.js";

import { notFound, serverError, ok, created } from "../utils/apiResponse.js";

// Retrieve all items for a specific order by order ID
export const getAllOrderItem = async (req, res) => {

  try {
    const order_id = req.params.orderId;
    const allOrder = await Orders(order_id);
    if (allOrder.length == 0) return notFound(res, "Items not found");
    return ok(res, "Items found Successfully", allOrder);
  } catch (error) {
   return  serverError(res)
  }
}
// Retrieve a single order item by order ID and item ID
export const getOneItem = async (req, res) => {
  try {
    const order_Id = req.params.orderId;
    const item_Id = req.params.itemId;
    const singleItem = await OrdersItems(order_Id, item_Id);
    if (!singleItem  || singleItem.length == 0) return notFound(res, "Item not found")
    return ok(res, "Item found seccessfully",singleItem)
  } catch (error) {
   return  serverError(res)
  }
}