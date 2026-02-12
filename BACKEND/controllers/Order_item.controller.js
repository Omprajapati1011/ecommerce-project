// import { getCart, getCompareProductCategory } from "../models/Order_master.model.js";
import { Orders } from "../models/Order_items.model.js";

import { notFound, serverError, ok, created } from "../utils/apiResponse.js";
// Get all products that are currently in the user's cart.
// NOTE: userId is hard-coded for now; in a real app,
//       you would read this from the authenticated user.

// Create order_items rows for each product in the user's cart,
// applying discount, tax and shipping to calculate final totals.

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
export const getOneItem = async (req, res) => {
  try {
    const order_Id = req.params.orderId;
    const item_Id = req.params.orderId;
    const singleItem = await Orders(order_Id, item_Id);
    if (!singleItem  || singleItem.length == 0) return notFound(res, "Item not found")
    return ok(res, "Item found seccessfully")
  } catch (error) {
   return  serverError(res)
  }
}