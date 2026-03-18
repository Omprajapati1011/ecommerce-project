import pool from "../configs/db.js";

async function getOrCreateCartByUserId(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM cart_master WHERE user_id = ? AND is_deleted = 0 LIMIT 1",
    [userId],
  );

  if (rows.length > 0) {
    return rows[0];
  }

  const [result] = await pool.query(
    "INSERT INTO cart_master (user_id, created_by, updated_by) VALUES (?, ?, ?)",
    [userId, userId, userId],
  );

  const cartId = result.insertId;

  return {
    cart_id: cartId,
    user_id: userId,
  };
}

async function getCartItemsWithProduct(cartId) {
  const [rows] = await pool.query(
    `SELECT ci.cart_item_id,
            ci.product_id,
            ci.quantity,
            ci.price AS effective_price,
            ci.product_portion_id,
            ci.modifier_id,
            ci.combination_id,
            ci.modifier_key,
            ci.offer_id AS item_offer_id,
            pm.display_name,
            pm.short_description,
            pp.portion_id,
            por.portion_value,
            pp.price AS portion_price,
            pp.discounted_price AS portion_discounted_price,
            mc.name AS combination_name,
            mc.additional_price AS combination_additional_price,
            pi.image_url
       FROM cart_items ci
       JOIN product_master pm ON pm.product_id = ci.product_id
       LEFT JOIN product_portion pp ON pp.product_portion_id = ci.product_portion_id AND pp.product_id = ci.product_id
       LEFT JOIN portion_master por ON por.portion_id = pp.portion_id
       LEFT JOIN modifier_combination mc ON mc.combination_id = ci.combination_id AND mc.is_deleted = 0
       LEFT JOIN product_images pi ON pi.product_id = ci.product_id AND pi.is_primary = 1 AND pi.is_deleted = 0
      WHERE ci.cart_id = ? AND ci.is_deleted = 0
      ORDER BY ci.cart_item_id`,
    [cartId],
  );

  // Fetch many-to-many modifiers for each item
  const cartItemIds = rows.map(r => r.cart_item_id);
  let modifiersMap = {};
  if (cartItemIds.length > 0) {
    const mods = await getCartItemModifiers(cartItemIds);
    mods.forEach(m => {
      if (!modifiersMap[m.cart_item_id]) modifiersMap[m.cart_item_id] = [];
      modifiersMap[m.cart_item_id].push(m);
    });
  }

  return rows.map(row => ({
    ...row,
    modifiers: modifiersMap[row.cart_item_id] || []
  }));
}

async function getCartScopeDetails(cartId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT
            ci.product_id,
            COALESCE(pc.category_id, pm.category_id) AS category_id
       FROM cart_items ci
       JOIN product_master pm ON pm.product_id = ci.product_id
       LEFT JOIN product_categories pc ON pc.product_id = ci.product_id
      WHERE ci.cart_id = ? AND ci.is_deleted = 0`,
    [cartId],
  );

  const productIds = [...new Set(rows.map((row) => Number(row.product_id)))];
  const categoryIds = [
    ...new Set(
      rows
        .map((row) =>
          row.category_id === null ? null : Number(row.category_id),
        )
        .filter((id) => id !== null),
    ),
  ];

  return { productIds, categoryIds };
}

async function findCartItem(
  cartId,
  productId,
  productPortionId = null,
  combinationId = null,
  modifierKey = null,
) {
  let query =
    "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND is_deleted = 0";
  const params = [cartId, productId];

  if (productPortionId !== null) {
    query += " AND product_portion_id = ?";
    params.push(productPortionId);
  } else {
    query += " AND product_portion_id IS NULL";
  }

  if (combinationId !== null) {
    query += " AND combination_id = ?";
    params.push(combinationId);
  } else {
    query += " AND combination_id IS NULL";
  }

  if (modifierKey !== null) {
    query += " AND modifier_key = ?";
    params.push(modifierKey);
  } else {
    query += " AND modifier_key IS NULL";
  }

  query += " LIMIT 1";

  const [rows] = await pool.query(query, params);
  return rows[0] || null;
}

async function insertCartItem({
  cartId,
  productId,
  quantity,
  price,
  productPortionId = null,
  combinationId = null,
  modifierKey = null,
  userId,
}) {
  const [result] = await pool.query(
    "INSERT INTO cart_items (cart_id, product_id, product_portion_id, combination_id, modifier_key, quantity, price, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      cartId,
      productId,
      productPortionId,
      combinationId,
      modifierKey,
      quantity,
      price,
      userId,
      userId,
    ],
  );

  return result.insertId;
}

async function updateCartItemQuantity(cartItemId, quantity, userId) {
  await pool.query(
    "UPDATE cart_items SET quantity = ?, updated_by = ? WHERE cart_item_id = ?",
    [quantity, userId, cartItemId],
  );
}

async function deleteCartItem(cartItemId, userId) {
  await pool.query(
    "UPDATE cart_items SET is_deleted = 1, updated_by = ? WHERE cart_item_id = ?",
    [userId, cartItemId],
  );
}

async function clearCartItems(cartId, userId) {
  await pool.query(
    "UPDATE cart_items SET is_deleted = 1, updated_by = ? WHERE cart_id = ? AND is_deleted = 0",
    [userId, cartId],
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

       FROM product_master

      WHERE product_id = ?

      LIMIT 1`,

    [productId],
  );

  const product = rows[0];

  if (!product || product.is_deleted || !product.is_active) {
    return null;
  }

  const effectivePrice = product.discounted_price ?? product.price;

  return {
    productId: product.product_id,

    name: product.display_name,

    price: effectivePrice,
  };
}

async function getPortionPricing(productPortionId) {
  const [rows] = await pool.query(
    `SELECT pp.product_portion_id,
            pp.portion_id,
            pp.price,
            pp.discounted_price,
            pp.is_active,
            pp.is_deleted,
            por.portion_value
       FROM product_portion pp
       JOIN portion_master por ON por.portion_id = pp.portion_id
      WHERE pp.product_portion_id = ?
      LIMIT 1`,

    [productPortionId],
  );

  const portion = rows[0];

  if (!portion || portion.is_deleted || !portion.is_active) {
    return null;
  }

  return {
    productPortionId: portion.product_portion_id,

    portionId: portion.portion_id,

    portionValue: portion.portion_value,

    price: portion.discounted_price ?? portion.price,
  };
}

async function getCombinationPricing(combinationId) {
  const [rows] = await pool.query(
    `SELECT combination_id,
            name,
            additional_price,
            stock,
            is_active,
            is_deleted
       FROM modifier_combination
      WHERE combination_id = ?
      LIMIT 1`,
    [combinationId],
  );

  const combo = rows[0];
  if (!combo || combo.is_deleted || !combo.is_active) return null;
  if (combo.stock <= 0) return null;  // out of stock

  return {
    combinationId: combo.combination_id,
    name: combo.name,
    additionalPrice: Number(combo.additional_price) || 0,
    stock: combo.stock,
  };
}

async function getModifierPricing(modifierId) {
  const [rows] = await pool.query(
    `SELECT modifier_id,

            modifier_name,

            modifier_value,

            additional_price,

            is_active,

            is_deleted

       FROM modifier_master

      WHERE modifier_id = ?

      LIMIT 1`,

    [modifierId],
  );

  const modifier = rows[0];

  if (!modifier || modifier.is_deleted || !modifier.is_active) {
    return null;
  }

  return {
    modifierId: modifier.modifier_id,

    modifierName: modifier.modifier_name,

    modifierValue: modifier.modifier_value,

    additionalPrice: modifier.additional_price,
  };
}

async function getFirstAvailablePortion(productId) {
  const [rows] = await pool.query(
    `SELECT pp.product_portion_id,
            pp.portion_id,
            pp.price,
            pp.discounted_price,
            pp.is_active,
            pp.is_deleted,
            por.portion_value
       FROM product_portion pp
       JOIN portion_master por ON por.portion_id = pp.portion_id
      WHERE pp.product_id = ? AND pp.is_deleted = 0 AND pp.is_active = 1
      ORDER BY pp.product_portion_id
      LIMIT 1`,
    [productId],
  );

  const portion = rows[0];

  if (!portion) {
    return null;
  }

  return {
    productPortionId: portion.product_portion_id,
    portionId: portion.portion_id,
    portionValue: portion.portion_value,
    price: portion.discounted_price ?? portion.price,
  };
}

async function insertCartItemModifiers(cartItemId, modifierIds) {
  if (!modifierIds || modifierIds.length === 0) return;
  const values = modifierIds.map((id) => [cartItemId, id]);
  await pool.query(
    "INSERT IGNORE INTO cart_item_modifiers (cart_item_id, modifier_id) VALUES ?",
    [values],
  );
}

async function getCartItemModifiers(cartItemIds) {
  if (!cartItemIds || cartItemIds.length === 0) return [];
  const [rows] = await pool.query(
    `SELECT cim.cart_item_id,
            mm.modifier_id,
            mm.modifier_type,
            mm.modifier_name,
            mm.modifier_value,
            mm.additional_price
       FROM cart_item_modifiers cim
       JOIN modifier_master mm ON mm.modifier_id = cim.modifier_id AND mm.is_deleted = 0
      WHERE cim.cart_item_id IN (?)`,
    [cartItemIds],
  );
  return rows;
}

async function getMultipleModifierPricing(modifierIds) {
  if (!modifierIds || modifierIds.length === 0) return [];
  const [rows] = await pool.query(
    `SELECT modifier_id,
            modifier_name,
            modifier_value,
            modifier_type,
            additional_price
       FROM modifier_master
      WHERE modifier_id IN (?)
        AND is_deleted = 0
        AND is_active = 1`,
    [modifierIds],
  );
  return rows;
}

export {
  getOrCreateCartByUserId,
  getCartItemsWithProduct,
  getCartScopeDetails,
  findCartItem,
  insertCartItem,
  insertCartItemModifiers,
  getCartItemModifiers,
  getMultipleModifierPricing,
  getCombinationPricing,
  updateCartItemQuantity,
  deleteCartItem,
  clearCartItems,
  getProductPricing,
  getPortionPricing,
  getModifierPricing,
  getFirstAvailablePortion,
};
