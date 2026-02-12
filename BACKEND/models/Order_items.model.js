import pool from "../configs/db.js";
import mysql from "mysql2/promise";

// Get basic product data (currently only name) for a list of product ids.
export const getProducts = async (productIds) => {
  const [products] = await pool.query(
    "select pm.name from product_master pm where pm.product_id in (?)",
    [productIds]
  );
  return products;
};

// Get order ids for a given user.
export const getOrderId = async (userId) => {
  const [order_id] = await pool.query(
    "select order_id from order_master where user_id= ? ",
    [userId]
  );

  return order_id;
};

// Get discount percentage per category (no type here, only value).
export const getDiscountOnItem = async (category_id) => {
  const [discount] = await pool.query(
    "select distinct discount_value,category_id from offer_master  where category_id in (?)",
    category_id
  );

  return discount;
};

// Insert a single row into order_items.
export const insertQuery = async (value) => {
  const insert = await pool.query(
    `INSERT INTO order_items
        (order_id, product_id, product_name, quantity, price, discount, tax, total)
        VALUES ?;
`,
    [value]
  );
  await pool.query(`DELETE FROM cart_items`)
  return insert;
};
export const Orders = async (order_Id,item_Id) => {
  const [rows] = await pool.query("select * from order_items where order_id =  ? and order_item_id= ?  ",[order_Id,item_Id])
  return rows;
}