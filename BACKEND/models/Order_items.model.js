import pool from "../configs/db.js";
import mysql from "mysql2/promise";

// Fetch product names and IDs from product master table
export const getProducts = async (productIds) => {
  const [products] = await pool.query(
    "select pm.name, pm.product_id from product_master pm where pm.product_id in (?)",
    [productIds],
  );
  return products;
};

// Retrieve all order IDs for a specific user
export const getOrderId = async (userId) => {
  const [order_id] = await pool.query(
    "select order_id from order_master where user_id= ? ",
    [userId],
  );

  return order_id;
};

// Fetch discount values for a category
export const getDiscountOnItem = async (category_id) => {
  const [discount] = await pool.query(
    "select distinct discount_value,category_id from offer_master  where category_id in (?)",
    category_id,
  );

  return discount;
};

// Insert order items and clear cart items
export const insertQuery = async (values, cart_id, order_id, modifiersMapping) => {
  const [insert] = await pool.query(
    `INSERT INTO order_items
     (order_id, product_id, product_portion_id, modifier_id,
      product_name, portion_value, modifier_value,
      quantity, price, discount, tax, total, created_by,updated_by)
     VALUES ?`,
    [values],
  );

  if (modifiersMapping && modifiersMapping.length > 0) {
    const [orderItems] = await pool.query(`SELECT order_item_id FROM order_items WHERE order_id = ? ORDER BY order_item_id ASC`, [order_id]);
    const modifierValues = [];
    for (let i = 0; i < orderItems.length; i++) {
       const oItemId = orderItems[i].order_item_id;
       const mods = modifiersMapping[i];
       if (mods && mods.length > 0) {
          for (const mod of mods) {
             modifierValues.push([oItemId, mod.modifier_id, mod.modifier_name, mod.modifier_value, mod.modifier_type, mod.additional_price || 0]);
          }
       }
    }
    if (modifierValues.length > 0) {
       await pool.query(`INSERT IGNORE INTO order_item_modifiers (order_item_id, modifier_id, modifier_name, modifier_value, modifier_type, additional_price) VALUES ?`, [modifierValues]);
    }
  }

  await pool.query("update cart_items set is_deleted=1 where cart_id = ? ", [
    cart_id,
  ]);
  return insert;
};

// Retrieve items for a specific order with pagination
export const Orders = async (order_Id, limit, offset) => {
  const [rows] = await pool.query(
    "SELECT * FROM order_items WHERE order_id = ? LIMIT ? OFFSET ?",
    [order_Id, limit, offset],
  );
  return rows;
};

// Count total items for a specific order
export const countOrderItems = async (order_Id) => {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as total FROM order_items WHERE order_id = ?",
    [order_Id],
  );
  return rows[0].total;
};

export const OrdersItems = async (order_Id, item_Id) => {
  const [rows] = await pool.query(
    "SELECT * FROM order_items WHERE order_id = ? AND order_item_id = ?",
    [order_Id, item_Id],
  );
  return rows;
};
