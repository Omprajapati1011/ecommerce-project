import pool from "../configs/db.js";
import { getCartItemModifiers } from "./cart.model.js";

// ============================================================================
// OFFER MODEL QUERIES
// ============================================================================

/**
 * Check whether a conflicting offer already exists for the same time window.
 * Conflict rules:
 * - same `offer_name` and `offer_type`
 * - date range overlap
 * - time range overlap
 * @param {object} offerData - Offer payload used for conflict detection
 * @returns {Promise<boolean>} True when a conflicting offer exists
 */
export const checkOfferExist = async (offerData) => {
  const { offer_name, offer_type, start_date, end_date, start_time, end_time } =
    offerData;
  const [rows] = await pool.query(
    `SELECT offer_id from offer_master 
      WHERE offer_name = ?
      AND offer_type = ?
      AND is_deleted = 0

        -- DATE OVERLAP
       AND start_date < ?
       AND end_date > ?

       -- TIME OVERLAP (handles both normal and midnight-crossing ranges)
       AND (
         -- If either side has no time window, treat it as whole-day overlap.
         start_time IS NULL
         OR end_time IS NULL
         OR ? IS NULL
         OR ? IS NULL
         OR (
           CASE 
             WHEN start_time <= end_time THEN
               -- Normal range: stored start <= stored end
               -- Overlap if: incoming_start < stored_end AND incoming_end > stored_start
               ? < end_time AND ? > start_time
             WHEN start_time > end_time THEN
               -- Midnight-crossing range: stored start > stored end
               -- Overlap if: incoming_start > stored_start OR incoming_end < stored_end
               ? > start_time OR ? < end_time
             ELSE 0
           END
         )
       )`,
    [
      offer_name,
      offer_type,
      end_date,
      start_date,
      start_time,
      end_time,
      end_time,
      start_time,
      end_time,
      start_time,
    ],
  );
  return rows.length > 0;
};

/**
 * Create a new offer record
 * @param {object} offerData - Offer payload
 * @returns {Promise<object>} Insert result
 */

export const createOffer = async (offerData, userId) => {
  const {
    offer_name,
    description,
    offer_type,
    discount_type,
    discount_value,
    maximum_discount_amount,
    min_purchase_amount,
    usage_limit_per_user,
    start_date,
    end_date,
    start_time,
    end_time,
  } = offerData;

  const [result] = await pool.query(
    "INSERT INTO `offer_master`(offer_name,description,offer_type,discount_type,discount_value,maximum_discount_amount,min_purchase_amount,usage_limit_per_user,start_date,end_date,start_time,end_time,created_by,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      offer_name,
      description,
      offer_type,
      discount_type,
      discount_value,
      maximum_discount_amount,
      min_purchase_amount,
      usage_limit_per_user,
      start_date,
      end_date,
      start_time,
      end_time,
      userId,
      userId,
    ],
  );
  return result;
};

/**
 * Fetch all offers
 * @returns {Promise<Array>} Offer rows
 */
export const getAllOffer = async () => {
  const [result] = await pool.query("SELECT * FROM `offer_master`");
  return result;
};

/**
 * Fetch a single offer by id (not deleted)
 * @param {number|string} offerId - Offer identifier
 * @returns {Promise<Array>} Offer rows
 */
export const getOfferById = async (offerId) => {
  const [result] = await pool.query(
    "SELECT * FROM `offer_master` WHERE offer_id=? AND is_deleted=0 AND is_active=1",
    [offerId],
  );
  return result;
};

/**
 * Update an existing offer by id (soft-deleted rows are excluded).
 * @param {number|string} offerId - Offer identifier
 * @param {object} offerData - Offer payload
 * @param {number|string} userId - User identifier
 * @returns {Promise<object>} Update result
 */

export const updateOfferById = async (offerId, offerData, userId) => {
  // Allowed fields for update
  const allowedFields = [
    "offer_name",
    "description",
    "offer_type",
    "discount_type",
    "discount_value",
    "maximum_discount_amount",
    "min_purchase_amount",
    "usage_limit_per_user",
    "start_date",
    "end_date",
    "start_time",
    "end_time",
    "is_active",
  ];

  const fields = [];
  const values = [];

  for (const key in offerData) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(offerData[key]);
    }
  }

  if (fields.length === 0) {
    return null; // nothing to update
  }

  fields.push("updated_by = ?");
  values.push(userId);

  const query = `
    UPDATE offer_master
    SET ${fields.join(", ")}
    WHERE offer_id = ?
    AND is_deleted = 0
  `;

  values.push(offerId);

  const [result] = await pool.query(query, values);

  return result;
};

/**
 * Soft delete an offer by id.
 * @param {number|string} offerId - Offer identifier
 * @param {number|string} userId - User identifier
 * @returns {Promise<object>} Update result
 */

export const deleteOfferById = async (offerId, userId) => {
  const [result] = await pool.query(
    `UPDATE offer_master
     SET is_deleted=1, updated_by=?
     WHERE offer_id=? AND is_deleted=0`,
    [userId, offerId],
  );
  return result;
};

/**
 * Update active status for an offer by id (soft-deleted rows are excluded).
 * @param {number|string} offerId - Offer identifier
 * @param {number|string} userId - User identifier
 * @param {number} isActive - Status flag (0 or 1)
 * @returns {Promise<object>} Update result
 */

export const activeupdateOfferStatusById = async (
  isActive,
  offerId,
  userId,
) => {
  const [result] = await pool.query(
    `UPDATE offer_master
     SET is_active=?, updated_by=?
     WHERE offer_id=? AND is_deleted=0`,
    [isActive, userId, offerId],
  );
  return result;
};

/**
 * Fetch all active, non-deleted offers.
 * @returns {Promise<Array>} Offer rows
 */

export const getActiveOffer = async () => {
  const [result] = await pool.query(
    `SELECT * FROM offer_master WHERE is_active=1 AND is_deleted=0`,
  );
  return result;
};

/**
 * Retrieve a currently valid offer by name.
 * Validation in SQL includes:
 * - active + non-deleted status
 * - current date within start/end date window
 * - current time within optional start/end time window
 * @param {string} offerName - Offer name/code entered by client
 * @returns {Promise<Array>} Matching offer rows (max 1 row)
 */
export const getValidateOfferByName = async (offerName) => {
  const [result] = await pool.query(
    `
    SELECT *
    FROM offer_master
    WHERE offer_name = ?
      AND is_active = 1
      AND is_deleted = 0
      AND start_date <= NOW()
      AND end_date >= NOW()
      AND (
        start_time IS NULL OR end_time IS NULL
        OR (
          CASE 
            WHEN start_time <= end_time THEN
              CURTIME() BETWEEN start_time AND end_time
            WHEN start_time > end_time THEN
              CURTIME() >= start_time OR CURTIME() <= end_time
            ELSE 0
          END
        )
      )
    LIMIT 1
    `,
    [offerName],
  );
  return result;
};

/**
 * Count how many times a user has used a specific offer.
 * @param {number|string} offerId - Offer identifier
 * @param {number|string} userId - User identifier
 * @returns {Promise<number>} Usage count
 */
export const getOfferUsageCount = async (offerId, userId) => {
  const [result] = await pool.query(
    `
    SELECT COUNT(*) AS usage_count
    FROM offer_usage
    WHERE offer_id = ? AND user_id = ?
    `,
    [offerId, userId],
  );

  return result[0].usage_count;
};

/**
 * Check whether an active offer is mapped to the given product/category scope.
 * At least one of productId/categoryId should be provided by caller.
 * @param {number|string} offerId - Offer identifier
 * @param {number|null} productId - Product identifier
 * @param {number|null} categoryId - Category identifier
 * @returns {Promise<boolean>} True when matching active mapping exists
 */
export const isOfferMappedToScope = async (offerId, productId, categoryId) => {
  const [result] = await pool.query(
    `SELECT offer_product_category_id
     FROM offer_product_category
     WHERE offer_id = ?
       AND is_active = 1
       AND is_deleted = 0
       AND (
         (? IS NOT NULL AND product_id = ?)
         OR (? IS NOT NULL AND category_id = ?)
       )
     LIMIT 1`,
    [offerId, productId, productId, categoryId, categoryId],
  );

  return result.length > 0;
};

/**
 * Fetch all usage entries for a specific offer.
 * @param {number|string} offerId - Offer identifier
 * @returns {Promise<Array>} Offer usage rows
 */
export const getOfferUsageByOfferId = async (offerId) => {
  const [result] = await pool.query(
    `SELECT ou.offer_usage_id,
    ou.offer_id,
    om.offer_name,
    om.offer_type,
    om.discount_type,
    om.discount_value,
    ou.user_id,
    um.name AS username,
    ou.order_id,
    ou.discount_amount,
    ou.created_at
    FROM offer_usage AS ou
    LEFT JOIN offer_master AS om
    ON om.offer_id = ou.offer_id
    LEFT JOIN user_master AS um
    ON um.user_id = ou.user_id
    WHERE ou.offer_id = ?`,
    [offerId],
  );
  return result;
};
/**
 * Fetch all usage entries for a specific user.
 * @param {number|string} userId - User identifier
 * @returns {Promise<Array>} Offer usage rows
 */
export const getOfferUsageByUserId = async (userId) => {
  const [result] = await pool.query(
    `SELECT ou.offer_usage_id,
    ou.offer_id,
    om.offer_name,
    om.offer_type,
    om.discount_type,
    om.discount_value,
    ou.user_id,
    um.name AS username,
    ou.order_id,
    ou.discount_amount,
    ou.created_at
    FROM offer_usage AS ou
    LEFT JOIN offer_master AS om
    ON om.offer_id = ou.offer_id
    LEFT JOIN user_master AS um
    ON um.user_id = ou.user_id
    WHERE ou.user_id = ?`,
    [userId],
  );
  return result;
};

/**
 * Fetch offer-level usage analytics summary.
 * Includes each offer with:
 * - total number of usage records
 * - total discount amount granted
 * @returns {Promise<Array>} Usage summary rows ordered by total usage (desc)
 */
export const getAllOfferUsageSummary = async () => {
  const [result] = await pool.query(`SELECT 
      om.offer_id,
      om.offer_name,
      om.offer_type,
      om.discount_type,
      om.discount_value,
      COUNT(ou.offer_usage_id) AS total_usage,
      COALESCE(SUM(ou.discount_amount), 0) AS total_discount_given
    FROM  offer_usage ou
    LEFT JOIN offer_master om
      ON om.offer_id = ou.offer_id
    GROUP BY 
      om.offer_id,
      om.offer_name,
      om.offer_type,
      om.discount_type,
      om.discount_value
    ORDER BY total_usage DESC
    `);

  return result;
};

export const createOfferUsage = async (offerData) => {
  const { offer_id, user_id, order_id, discount_amount } = offerData;

  const [result] = await pool.query(
    `INSERT INTO offer_usage
     (offer_id, user_id, order_id, discount_amount)
     VALUES (?, ?, ?, ?)`,
    [offer_id, user_id, order_id, discount_amount],
  );

  return result;
};

// ============================================================================
// OFFER PRODUCT CATEGORY MAPPING QUERIES
// ============================================================================

/**
 * Check whether an offer exists in offer_master and is not deleted.
 * @param {number|string} offerId - Offer identifier
 * @returns {Promise<boolean>} True when offer exists
 */
export const isOfferExistsById = async (offerId) => {
  const [result] = await pool.query(
    `SELECT offer_id
     FROM offer_master
     WHERE offer_id = ? AND is_deleted = 0
     LIMIT 1`,
    [offerId],
  );

  return result.length > 0;
};

/**
 * Fetch offer type by id without checking active status.
 * @param {number|string} offerId - Offer identifier
 * @returns {Promise<object|null>} Offer row with offer_type or null
 */
export const getOfferTypeByIdWithoutActiveCheck = async (offerId) => {
  const [result] = await pool.query(
    `SELECT offer_id, offer_type
     FROM offer_master
     WHERE offer_id = ? AND is_deleted = 0
     LIMIT 1`,
    [offerId],
  );

  return result[0] ?? null;
};

/**
 * Check whether offer-product/category mapping already exists.
 * @param {object} mappingData - Mapping payload
 * @returns {Promise<boolean>} True when mapping exists
 */
export const isOfferProductCategoryMappingExists = async (mappingData) => {
  const { offer_id, product_id, category_id } = mappingData;

  const [result] = await pool.query(
    `SELECT offer_product_category_id
     FROM offer_product_category
     WHERE offer_id = ?
       AND is_deleted = 0
       AND (
         (? IS NULL AND ? IS NULL AND product_id IS NULL AND category_id IS NULL)
         OR
         (? IS NOT NULL AND product_id = ?)
         OR (? IS NOT NULL AND category_id = ?)
       )
     LIMIT 1`,
    [
      offer_id,
      product_id,
      category_id,
      product_id,
      product_id,
      category_id,
      category_id,
    ],
  );

  return result.length > 0;
};

/**
 * Create offer to product/category mapping.
 * @param {object} mappingData - Mapping payload
 * @param {number|string} userId - Authenticated user id
 * @returns {Promise<object>} Insert result
 */
export const createOfferProductCategoryMapping = async (
  mappingData,
  userId,
) => {
  const { offer_id, product_id, category_id } = mappingData;

  const [result] = await pool.query(
    `INSERT INTO offer_product_category
    (offer_id, product_id, category_id, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?)`,
    [offer_id, product_id ?? null, category_id ?? null, userId, userId],
  );

  return result;
};

/**
 * Fetch all non-deleted mappings.
 * @returns {Promise<Array>} Mapping rows
 */
export const getAllOfferProductCategoryMappings = async () => {
  const [result] = await pool.query(
    `SELECT opc.*,
            om.offer_name,
            om.description AS offer_description,
            om.offer_type,
            om.discount_type AS offer_discount_type,
            om.discount_value AS offer_discount_value,
            om.maximum_discount_amount AS offer_maximum_discount_amount,
            om.min_purchase_amount AS offer_min_purchase_amount,
            om.usage_limit_per_user AS offer_usage_limit_per_user,
            om.start_date AS offer_start_date,
            om.end_date AS offer_end_date,
            om.start_time AS offer_start_time,
            om.end_time AS offer_end_time,
            om.is_active AS offer_is_active
     FROM offer_product_category AS opc
     INNER JOIN offer_master AS om
        ON om.offer_id = opc.offer_id
     WHERE opc.is_deleted = 0`,
  );

  return result;
};

/**
 * Fetch all active mappings for a given offer id.
 * @param {number|string} offerId - Offer identifier
 * @returns {Promise<Array>} Mapping rows
 */
export const getOfferProductCategoryMappingsByOfferId = async (offerId) => {
  const [result] = await pool.query(
    `SELECT opc.*,
            om.offer_name,
            om.description AS offer_description,
            om.offer_type,
            om.discount_type AS offer_discount_type,
            om.discount_value AS offer_discount_value,
            om.maximum_discount_amount AS offer_maximum_discount_amount,
            om.min_purchase_amount AS offer_min_purchase_amount,
            om.usage_limit_per_user AS offer_usage_limit_per_user,
            om.start_date AS offer_start_date,
            om.end_date AS offer_end_date,
            om.start_time AS offer_start_time,
            om.end_time AS offer_end_time,
            om.is_active AS offer_is_active
     FROM offer_product_category AS opc
     INNER JOIN offer_master AS om
        ON om.offer_id = opc.offer_id
     WHERE opc.offer_id = ?
       AND opc.is_deleted = 0`,
    [offerId],
  );

  return result;
};

/**
 * Fetch one mapping by mapping id.
 * @param {number|string} mappingId - Mapping identifier
 * @returns {Promise<Array>} Mapping row
 */
export const getOfferProductCategoryMappingById = async (mappingId) => {
  const [result] = await pool.query(
    `SELECT opc.*,
            om.offer_name,
            om.description AS offer_description,
            om.offer_type,
            om.discount_type AS offer_discount_type,
            om.discount_value AS offer_discount_value,
            om.maximum_discount_amount AS offer_maximum_discount_amount,
            om.min_purchase_amount AS offer_min_purchase_amount,
            om.usage_limit_per_user AS offer_usage_limit_per_user,
            om.start_date AS offer_start_date,
            om.end_date AS offer_end_date,
            om.start_time AS offer_start_time,
            om.end_time AS offer_end_time,
            om.is_active AS offer_is_active
     FROM offer_product_category AS opc
     INNER JOIN offer_master AS om
        ON om.offer_id = opc.offer_id
     WHERE opc.offer_product_category_id = ?
       AND opc.is_deleted = 0`,
    [mappingId],
  );

  return result;
};

/**
 * Check duplicate mapping for the same offer and scope while updating.
 * @param {number|string} offerId - Offer identifier
 * @param {number|null} productId - Product identifier
 * @param {number|null} categoryId - Category identifier
 * @param {number|string} excludeMappingId - Mapping id to exclude
 * @returns {Promise<boolean>} True when duplicate exists
 */
export const isOfferProductCategoryDuplicateOnUpdate = async (
  offerId,
  productId,
  categoryId,
  excludeMappingId,
) => {
  const [result] = await pool.query(
    `SELECT offer_product_category_id
     FROM offer_product_category
     WHERE offer_id = ?
       AND offer_product_category_id <> ?
       AND is_deleted = 0
       AND (
         (? IS NULL AND ? IS NULL AND product_id IS NULL AND category_id IS NULL)
         OR
         (? IS NOT NULL AND product_id = ?)
         OR (? IS NOT NULL AND category_id = ?)
       )`,
    [
      offerId,
      excludeMappingId,
      productId,
      categoryId,
      productId,
      productId,
      categoryId,
      categoryId,
    ],
  );

  return result.length > 0;
};

/**
 * Update mapping by mapping id.
 * Allowed fields: product_id, category_id, is_active
 * @param {number|string} mappingId - Mapping identifier
 * @param {object} updateData - Update payload
 * @param {number|string} userId - Authenticated user id
 * @returns {Promise<object|null>} Update result
 */
export const updateOfferProductCategoryMappingById = async (
  mappingId,
  updateData,
  userId,
) => {
  const allowedFields = ["product_id", "category_id", "is_active"];
  const fields = [];
  const values = [];

  for (const key in updateData) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    }
  }

  if (fields.length === 0) {
    return null;
  }

  fields.push("updated_by = ?");
  values.push(userId);
  values.push(mappingId);

  const [result] = await pool.query(
    `UPDATE offer_product_category
     SET ${fields.join(", ")}
     WHERE offer_product_category_id = ?
       AND is_deleted = 0`,
    values,
  );

  return result;
};

/**
 * Soft delete mapping by mapping id.
 * @param {number|string} mappingId - Mapping identifier
 * @param {number|string} userId - Authenticated user id
 * @returns {Promise<object>} Update result
 */
export const deleteOfferProductCategoryMappingById = async (
  mappingId,
  userId,
) => {
  const [result] = await pool.query(
    `UPDATE offer_product_category
     SET is_deleted = 1,
         is_active = 0,
         updated_by = ?
     WHERE offer_product_category_id = ?
       AND is_deleted = 0`,
    [userId, mappingId],
  );

  return result;
};

// ============================================================================
// CART OFFER INTEGRATION
// ============================================================================

/**
 * Apply offer to cart (cart-level offer)
 * @param {number} cartId - Cart ID
 * @param {number} offerId - Offer ID
 * @returns {Promise<object>} Update result
 */
export const applyOfferToCart = async (cartId, offerId) => {
  const [result] = await pool.query(
    `UPDATE cart_master
     SET offer_id = ?
     WHERE cart_id = ?`,
    [offerId, cartId],
  );
  return result;
};

/**
 * Remove offer from cart
 * @param {number} cartId - Cart ID
 * @returns {Promise<object>} Update result
 */
export const removeOfferFromCart = async (cartId) => {
  const [result] = await pool.query(
    `UPDATE cart_master
     SET offer_id = NULL, discount_amount = 0
     WHERE cart_id = ?`,
    [cartId],
  );
  return result;
};

/**
 * Apply offer to cart item (product-level offer)
 * @param {number} cartItemId - Cart Item ID
 * @param {number} offerId - Offer ID
 * @returns {Promise<object>} Update result
 */
export const applyOfferToCartItem = async (cartItemId, offerId) => {
  const [result] = await pool.query(
    `UPDATE cart_items
     SET offer_id = ?
     WHERE cart_item_id = ?`,
    [offerId, cartItemId],
  );
  return result;
};

/**
 * Remove offer from cart item
 * @param {number} cartItemId - Cart Item ID
 * @returns {Promise<object>} Update result
 */
export const removeOfferFromCartItem = async (cartItemId) => {
  const [result] = await pool.query(
    `UPDATE cart_items
     SET offer_id = NULL
     WHERE cart_item_id = ?`,
    [cartItemId],
  );
  return result;
};

/**
 * Get cart with applied offer details
 * @param {number} cartId - Cart ID
 * @returns {Promise<Array>} Cart with offer details
 */
export const getCartWithOffer = async (cartId) => {
  const [rows] = await pool.query(
    `SELECT cm.*,
            om.offer_name,
            om.offer_type,
            om.discount_type,
            om.discount_value,
            om.maximum_discount_amount,
            om.min_purchase_amount,
            om.usage_limit_per_user,
            om.start_date,
            om.end_date,
            om.start_time,
            om.end_time
     FROM cart_master cm
     LEFT JOIN offer_master om ON om.offer_id = cm.offer_id
     WHERE cm.cart_id = ? AND cm.is_deleted = 0`,
    [cartId],
  );
  return rows;
};

/**
 * Get cart items with product and offer details
 * @param {number} cartId - Cart ID
 * @returns {Promise<Array>} Cart items with offer details
 */
export const getCartItemsWithOffer = async (cartId) => {
  const [rows] = await pool.query(
    `SELECT ci.cart_item_id,
            ci.product_id,
            ci.quantity,
            ci.price AS effective_price,
            ci.product_portion_id,
            ci.combination_id,
            ci.offer_id AS item_offer_id,
            pm.display_name,
            pm.short_description,
            (
              SELECT pimg.image_url
              FROM product_images pimg
              WHERE pimg.product_id = ci.product_id AND pimg.is_deleted = 0
              ORDER BY pimg.is_primary DESC, pimg.image_id DESC
              LIMIT 1
            ) AS image_url,
            pp.portion_id,
            por.portion_value,
            pp.price AS portion_price,
            pp.discounted_price AS portion_discounted_price,
            mc.name AS combination_name,
            mc.additional_price AS combination_additional_price,
            item_offer.offer_name AS item_offer_name,
            item_offer.offer_type AS item_offer_type,
            item_offer.discount_type AS item_discount_type,
            item_offer.discount_value AS item_discount_value,
            item_offer.maximum_discount_amount AS item_max_discount
       FROM cart_items ci
       JOIN product_master pm ON pm.product_id = ci.product_id
       LEFT JOIN product_portion pp ON pp.product_portion_id = ci.product_portion_id AND pp.product_id = ci.product_id
       LEFT JOIN portion_master por ON por.portion_id = pp.portion_id
       LEFT JOIN modifier_combination mc ON mc.combination_id = ci.combination_id AND mc.is_deleted = 0
       LEFT JOIN offer_master item_offer ON item_offer.offer_id = ci.offer_id
      WHERE ci.cart_id = ? AND ci.is_deleted = 0
      ORDER BY ci.cart_item_id`,
    [cartId],
  );

  if (rows.length > 0) {
    const cartItemIds = rows.map((r) => r.cart_item_id);
    const modifierRows = await getCartItemModifiers(cartItemIds);
    const modifierMap = {};
    modifierRows.forEach((m) => {
      if (!modifierMap[m.cart_item_id]) modifierMap[m.cart_item_id] = [];
      modifierMap[m.cart_item_id].push({
        modifierId: m.modifier_id,
        modifierType: m.modifier_type,
        modifierName: m.modifier_name,
        modifierValue: m.modifier_value,
        additionalPrice: Number(m.additional_price),
      });
    });
    rows.forEach((row) => {
      row.modifiers = modifierMap[row.cart_item_id] || [];
    });
  }

  return rows;
};

/**
 * Get active offers for a product id.
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} Offer rows
 */
export const getOfferByProductId = async (productId) => {
  const [rows] = await pool.query(
    `SELECT om.*,
            opc.offer_product_category_id,
            opc.product_id,
            opc.category_id
     FROM offer_master om
     INNER JOIN offer_product_category opc ON opc.offer_id = om.offer_id
     WHERE om.is_active = 1
       AND om.is_deleted = 0
       AND opc.is_active = 1
       AND opc.is_deleted = 0
       AND opc.product_id = ?
       AND CURDATE() BETWEEN om.start_date AND om.end_date
       AND (
         om.start_time IS NULL OR om.end_time IS NULL
         OR (
           CASE 
             WHEN om.start_time <= om.end_time THEN
               CURTIME() BETWEEN om.start_time AND om.end_time
             WHEN om.start_time > om.end_time THEN
               CURTIME() >= om.start_time OR CURTIME() <= om.end_time
             ELSE 0
           END
         )
       )
     ORDER BY om.discount_value DESC`,
    [productId],
  );
  return rows;
};

/**
 * Get active offers for a category id.
 * @param {number} categoryId - Category ID
 * @returns {Promise<Array>} Offer rows
 */
export const getOfferByCategoryId = async (categoryId) => {
  const [rows] = await pool.query(
    `SELECT om.*,
            opc.offer_product_category_id,
            opc.product_id,
            opc.category_id
     FROM offer_master om
     INNER JOIN offer_product_category opc ON opc.offer_id = om.offer_id
     WHERE om.is_active = 1
       AND om.is_deleted = 0
       AND opc.is_active = 1
       AND opc.is_deleted = 0
       AND opc.category_id = ?
       AND CURDATE() BETWEEN om.start_date AND om.end_date
       AND (
         om.start_time IS NULL OR om.end_time IS NULL
         OR (
           CASE 
             WHEN om.start_time <= om.end_time THEN
               CURTIME() BETWEEN om.start_time AND om.end_time
             WHEN om.start_time > om.end_time THEN
               CURTIME() >= om.start_time OR CURTIME() <= om.end_time
             ELSE 0
           END
         )
       )
     ORDER BY om.discount_value DESC`,
    [categoryId],
  );
  return rows;
};

/**
 * Get both product and category offers visible for a product detail page.
 * @param {number} productId - Product ID
 * @returns {Promise<{product_offers: Array, category_offers: Array}>}
 */
export const getVisibleOffersByProductId = async (productId) => {
  const productOffers = await getOfferByProductId(productId);

  const [categoryRows] = await pool.query(
    `SELECT DISTINCT category_id
     FROM product_categories
     WHERE product_id = ?`,
    [productId],
  );

  if (!categoryRows || categoryRows.length === 0) {
    return {
      product_offers: productOffers,
      category_offers: [],
    };
  }

  const categoryIds = categoryRows.map((row) => row.category_id);
  const categoryOfferBuckets = await Promise.all(
    categoryIds.map((categoryId) => getOfferByCategoryId(categoryId)),
  );

  const categoryOffers = categoryOfferBuckets.flat();

  return {
    product_offers: productOffers,
    category_offers: categoryOffers,
  };
};

/**
 * Backward-compatible alias: applicable offers for a product.
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} Applicable offers
 */
export const getApplicableOffersForProduct = async (productId) =>
  getOfferByProductId(productId);

/**
 * Backward-compatible alias: applicable offers for a category.
 * @param {number} categoryId - Category ID
 * @returns {Promise<Array>} Applicable offers
 */
export const getApplicableOffersForCategory = async (categoryId) =>
  getOfferByCategoryId(categoryId);

/**
 * Get applicable cart-level offers (flat_discount, first_order, time_based)
 * @returns {Promise<Array>} Applicable cart offers
 */
export const getApplicableCartOffers = async () => {
  const [rows] = await pool.query(
    `SELECT *
     FROM offer_master
     WHERE is_active = 1
       AND is_deleted = 0
       AND offer_type IN ('flat_discount', 'first_order', 'time_based')
       AND CURDATE() BETWEEN start_date AND end_date
       AND (
         start_time IS NULL OR end_time IS NULL
         OR (
           CASE 
             WHEN start_time <= end_time THEN
               CURTIME() BETWEEN start_time AND end_time
             WHEN start_time > end_time THEN
               CURTIME() >= start_time OR CURTIME() <= end_time
             ELSE 0
           END
         )
       )
     ORDER BY discount_value DESC`,
  );
  return rows;
};
