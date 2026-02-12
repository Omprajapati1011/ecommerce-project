import pool from "../configs/db.js";
import mysql from "mysql2/promise";

// Fetch product names and IDs from product master table
export const getProducts = async (productIds) => {
  const [products] = await pool.query(
    "select pm.name, pm.product_id from product_master pm where pm.product_id in (?)",
    [productIds]
  );
  return products;
};

// Retrieve all order IDs for a specific user
export const getOrderId = async (userId) => {
  const [order_id] = await pool.query(
    "select order_id from order_master where user_id= ? ",
    [userId]
  );

  return order_id;
};

// Fetch discount values for a category
export const getDiscountOnItem = async (category_id) => {
  const [discount] = await pool.query(
    "select distinct discount_value,category_id from offer_master  where category_id in (?)",
    category_id
  );

  return discount;
};

// Insert order items and clear cart items
export const insertQuery = async (values,productIds) => {
  const insert = await pool.query(
    `INSERT INTO order_items
     (order_id, product_id, product_portion_id, modifier_id,
      product_name, portion_value, modifier_value,
      quantity, price, discount, tax, total, created_by,updated_by)
     VALUES ?`,
    [values]
  );
  await pool.query("update cart_items set is_deleted=1 where product_id in (?)",[productIds])
  return insert;
};

// Retrieve a specific order item by order ID and item ID
export const Orders = async (order_Id,item_Id) => {
  const [rows] = await pool.query("select * from order_items where order_id =  ?  ",[order_Id])
  return rows;
}
export const OrdersItems = async (order_Id,item_Id) => {
  const [rows] = await pool.query("select * from order_items where order_id =  ? and order_item_id= ?  ",[order_Id,item_Id])
  return rows;
}