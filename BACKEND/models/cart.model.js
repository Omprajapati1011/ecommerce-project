// import pool from "../configs/db.js";



// async function getOrCreateCartByUserId(userId) {
//   const [rows] = await pool.query(
//     "SELECT * FROM cart_master WHERE user_id = ? AND is_deleted = 0 LIMIT 1",
//     [userId]
//   );

//   if (rows.length > 0) {
//     return rows[0];
//   }

//   const [result] = await pool.query(
//     "INSERT INTO cart_master (user_id, created_by, updated_by) VALUES (?, ?, ?)",
//     [userId, userId, userId]
//   );

//   const cartId = result.insertId;

//   return {
//     cart_id: cartId,
//     user_id: userId
//   };
// }



// async function getCartItemsWithProduct(cartId) {
//   const [rows] = await pool.query(
//     `SELECT ci.cart_item_id,
//             ci.product_id,
//             ci.quantity,
//             ci.price AS effective_price,
//             ci.product_portion_id,
//             ci.modifier_id,
//             pm.display_name,
//             pm.short_description,
//             por.portion_value,
//             pp.price AS portion_price,
//             pp.discounted_price AS portion_discounted_price,
//             mt.modifier_name,
//             mt.modifier_value
//        FROM cart_items ci
//        JOIN product_master pm ON pm.product_id = ci.product_id
//        LEFT JOIN product_portion pp ON pp.product_portion_id = ci.product_portion_id AND pp.product_id = ci.product_id
//        LEFT JOIN portion_master por ON por.portion_id = pp.portion_id
//        LEFT JOIN modifier_master mt ON mt.modifier_id = ci.modifier_id
//       WHERE ci.cart_id = ? AND ci.is_deleted = 0
//       ORDER BY ci.cart_item_id`,
//     [cartId]
//   );

//   return rows;
// }



// async function findCartItem(cartId, productId, productPortionId = null, modifierId = null) {
//   let query = "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND is_deleted = 0";
//   const params = [cartId, productId];
  
//   if (productPortionId !== null) {
//     query += " AND product_portion_id = ?";
//     params.push(productPortionId);
//   }
  
//   if (modifierId !== null) {
//     query += " AND modifier_id = ?";
//     params.push(modifierId);
//   }
  
//   query += " LIMIT 1";
  
//   const [rows] = await pool.query(query, params);
//   return rows[0] || null;
// }



// async function insertCartItem({ cartId, productId, quantity, price, productPortionId = null, modifierId = null, userId }) {
//   const [result] = await pool.query(
//     "INSERT INTO cart_items (cart_id, product_id, product_portion_id, modifier_id, quantity, price, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
//     [cartId, productId, productPortionId, modifierId, quantity, price, userId, userId]
//   );

//   return result.insertId;
// }



// async function updateCartItemQuantity(cartItemId, quantity, userId) {
//   await pool.query(
//     "UPDATE cart_items SET quantity = ?, updated_by = ? WHERE cart_item_id = ?",
//     [quantity, userId, cartItemId]
//   );
// }



// async function deleteCartItem(cartItemId, userId) {
//   await pool.query(
//     "UPDATE cart_items SET is_deleted = 1, updated_by = ? WHERE cart_item_id = ?",
//     [userId, cartItemId]
//   );
// }



// async function getProductPricing(productId) {

//   const [rows] = await pool.query(

//     `SELECT product_id,

//             display_name,

//             price,

//             discounted_price,

//             is_active,

//             is_deleted

//        FROM product_master

//       WHERE product_id = ?

//       LIMIT 1`,

//     [productId]

//   );



//   const product = rows[0];



//   if (!product || product.is_deleted || !product.is_active) {

//     return null;

//   }



//   const effectivePrice = product.discounted_price ?? product.price;



//   return {

//     productId: product.product_id,

//     name: product.display_name,

//     price: effectivePrice

//   };

// }



// async function getPortionPricing(productPortionId) {

//   const [rows] = await pool.query(

//     `SELECT pp.product_portion_id,
//             pp.portion_id,
//             pp.price,
//             pp.discounted_price,
//             pp.is_active,
//             pp.is_deleted,
//             por.portion_value
//        FROM product_portion pp
//        JOIN portion_master por ON por.portion_id = pp.portion_id
//       WHERE pp.product_portion_id = ?
//       LIMIT 1`,

//     [productPortionId]

//   );



//   const portion = rows[0];



//   if (!portion || portion.is_deleted || !portion.is_active) {

//     return null;

//   }



//   return {

//     productPortionId: portion.product_portion_id,

//     portionId: portion.portion_id,

//     portionValue: portion.portion_value,

//     price: portion.discounted_price ?? portion.price

//   };

// }



// async function getModifierPricing(modifierId) {

//   const [rows] = await pool.query(

//     `SELECT modifier_id,

//             modifier_name,

//             modifier_value,

//             additional_price,

//             is_active,

//             is_deleted

//        FROM modifier_master

//       WHERE modifier_id = ?

//       LIMIT 1`,

//     [modifierId]

//   );



//   const modifier = rows[0];



//   if (!modifier || modifier.is_deleted || !modifier.is_active) {

//     return null;

//   }



//   return {

//     modifierId: modifier.modifier_id,

//     modifierName: modifier.modifier_name,

//     modifierValue: modifier.modifier_value,

//     additionalPrice: modifier.additional_price

//   };

// }



// async function getFirstAvailablePortion(productId) {
//   const [rows] = await pool.query(
//     `SELECT pp.product_portion_id,
//             pp.portion_id,
//             pp.price,
//             pp.discounted_price,
//             pp.is_active,
//             pp.is_deleted,
//             por.portion_value
//        FROM product_portion pp
//        JOIN portion_master por ON por.portion_id = pp.portion_id
//       WHERE pp.product_id = ? AND pp.is_deleted = 0 AND pp.is_active = 1
//       ORDER BY pp.product_portion_id
//       LIMIT 1`,
//     [productId]
//   );

//   const portion = rows[0];

//   if (!portion) {
//     return null;
//   }

//   return {
//     productPortionId: portion.product_portion_id,
//     portionId: portion.portion_id,
//     portionValue: portion.portion_value,
//     price: portion.discounted_price ?? portion.price
//   };
// }



// export {

//   getOrCreateCartByUserId,

//   getCartItemsWithProduct,

//   findCartItem,

//   insertCartItem,

//   updateCartItemQuantity,

//   deleteCartItem,

//   getProductPricing,

//   getPortionPricing,

//   getModifierPricing,

//   getFirstAvailablePortion

// };

