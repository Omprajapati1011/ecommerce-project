import pool from "../configs/db.js";

async function getOrCreateCartByUserId(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM carts_master WHERE user_id = ? LIMIT 1",
    [userId]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  const [result] = await pool.query(
    "INSERT INTO carts_master (user_id) VALUES (?)",
    [userId]
  );

  const cartId = result.insertId;

  return {
    cart_id: cartId,
    user_id: userId
  };
}

async function getCartItemsWithProduct(cartId) {
  const [rows] = await pool.query(
    `SELECT ci.cart_item_id,
            ci.product_id,
            ci.quantity,
            ci.price,
            pm.display_name,
            pm.short_description
       FROM cart_items ci
       JOIN products_master pm ON pm.product_id = ci.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.cart_item_id`,
    [cartId]
  );

  return rows;
}

async function findCartItem(cartId, productId) {
  const [rows] = await pool.query(
    "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1",
    [cartId, productId]
  );

  return rows[0] || null;
}

async function insertCartItem({ cartId, productId, quantity, price }) {
  const [result] = await pool.query(
    "INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
    [cartId, productId, quantity, price]
  );

  return result.insertId;
}

async function updateCartItemQuantity(cartItemId, quantity) {
  await pool.query(
    "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?",
    [quantity, cartItemId]
  );
}

async function deleteCartItem(cartItemId) {
  await pool.query(
    "DELETE FROM cart_items WHERE cart_item_id = ?",
    [cartItemId]
  );
}

async function getProductPricing(productId) {
  const [rows] = await pool.query(
    `SELECT product_id,
            display_name,
            price,
            discounted_price,
            is_active,
            is_deleted
       FROM products_master
      WHERE product_id = ?
      LIMIT 1`,
    [productId]
  );

  const product = rows[0];

  if (!product || product.is_deleted || !product.is_active) {
    return null;
  }

  const effectivePrice = product.discounted_price ?? product.price;

  return {
    productId: product.product_id,
    name: product.display_name,
    price: effectivePrice
  };
}

export {
  getOrCreateCartByUserId,
  getCartItemsWithProduct,
  findCartItem,
  insertCartItem,
  updateCartItemQuantity,
  deleteCartItem,
  getProductPricing
};
