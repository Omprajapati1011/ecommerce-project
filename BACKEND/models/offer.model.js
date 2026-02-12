import pool from "../configs/db.js";

// ============================================================================
// OFFER MODEL QUERIES
// ============================================================================

/**
 * Check whether a conflicting offer already exists for the same scope and time window.
 * Conflict rules:
 * - same `offer_name` and `offer_type`
 * - date range overlap
 * - time range overlap
 * - same scope (`product_id` or `category_id`)
 * @param {object} offerData - Offer payload used for conflict detection
 * @returns {Promise<boolean>} True when a conflicting offer exists
 */
export const checkOfferExist = async (offerData) => {
  const {
    offer_name,
    offer_type,
    product_id,
    category_id,
    start_date,
    end_date,
    start_time,
    end_time,
  } = offerData;
  const [rows] = await pool.query(
    `SELECT offer_id from offer_master 
      WHERE offer_name = ?
      AND offer_type = ?
      AND is_deleted = 0

        -- DATE OVERLAP
       AND start_date < ?
       AND end_date > ?

       -- TIME OVERLAP
       AND start_time < ?
       AND end_time > ?

       -- SAME SCOPE
       AND (
         (? IS NOT NULL AND product_id = ?) OR
         (? IS NOT NULL AND category_id = ?)
       )`,
    [
      offer_name,
      offer_type,
      end_date,
      start_date,
      end_time,
      start_time,
      product_id,
      product_id,
      category_id,
      category_id,
    ],
  );
  return rows.length > 0;
};

/**
 * Create a new offer record
 * @param {object} offerData - Offer payload
 * @returns {Promise<object>} Insert result
 */

export const createOffer = async (offerData) => {
  const {
    offer_name,
    description,
    offer_type,
    discount_type,
    discount_value,
    maximum_discount_amount,
    min_purchase_amount,
    usage_limit_per_user,
    category_id,
    product_id,
    start_date,
    end_date,
    start_time,
    end_time,
    is_active,
    is_deleted,
    created_by,
    updated_by,
  } = offerData;

  const [result] = await pool.query(
    "INSERT INTO `offer_master`(offer_name,description,offer_type,discount_type,discount_value,maximum_discount_amount,min_purchase_amount,usage_limit_per_user,category_id,product_id,start_date,end_date,start_time,end_time,is_active,is_deleted,created_by,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      offer_name,
      description,
      offer_type,
      discount_type,
      discount_value,
      maximum_discount_amount,
      min_purchase_amount,
      usage_limit_per_user,
      category_id,
      product_id,
      start_date,
      end_date,
      start_time,
      end_time,
      is_active,
      is_deleted,
      created_by,
      updated_by,
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
 * @returns {Promise<object>} Update result
 */

export const updateOfferById = async (offerId, offerData) => {
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
    "category_id",
    "product_id",
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
 * @returns {Promise<object>} Update result
 */

export const deleteOfferById = async (offerId) => {
  const [result] = await pool.query(
    `UPDATE offer_master SET is_deleted=1 WHERE offer_id=? AND is_deleted=0`,
    [offerId],
  );
  return result;
};

/**
 * Update active status for an offer by id (soft-deleted rows are excluded).
 * @param {number|string} offerId - Offer identifier
 * @param {number} isActive - Status flag (0 or 1)
 * @returns {Promise<object>} Update result
 */

export const activeupdateOfferStatusById = async (offerId, isActive) => {
  const [result] = await pool.query(
    `UPDATE offer_master SET is_active=? WHERE offer_id=? AND is_deleted=0`,
    [isActive, offerId],
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
 * Fetch all non-deleted offers for a product.
 * @param {number|string} productID - Product identifier
 * @returns {Promise<Array>} Offer rows
 */

export const getOfferByProductId = async (productID) => {
  const [result] = await pool.query(
    `SELECT * FROM offer_master WHERE product_id=? AND is_deleted=0`,
    [productID],
  );
  return result;
};
/**
 * Fetch all non-deleted offers for a category.
 * @param {number|string} categoryID - Category identifier
 * @returns {Promise<Array>} Offer rows
 */

export const getOfferByCategoryId = async (categoryID) => {
  const [result] = await pool.query(
    `SELECT * FROM offer_master WHERE category_id=? AND is_deleted=0`,
    [categoryID],
  );
  return result;
};

/**
 * Retrieve a currently valid offer by name and scope.
 * Validation in SQL includes:
 * - active + non-deleted status
 * - current date within start/end date window
 * - current time within optional start/end time window
 * - scope match on product or category
 * @param {string} offerName - Offer name/code entered by client
 * @param {number|null} productId - Product scope identifier
 * @param {number|null} categoryId - Category scope identifier
 * @returns {Promise<Array>} Matching offer rows (max 1 row)
 */
export const getValidateOfferByName = async (
  offerName,
  productId,
  categoryId,
) => {
  const [result] = await pool.query(
    `
    SELECT *
    FROM offer_master
    WHERE offer_name = ?
      AND is_active = 1
      AND is_deleted = 0
      AND start_date <= CURDATE()
      AND end_date >= CURDATE()
      AND (
        start_time IS NULL OR end_time IS NULL
        OR (CURTIME() BETWEEN start_time AND end_time)
      )
      AND (
        (? IS NOT NULL AND product_id = ?)
        OR (? IS NOT NULL AND category_id = ?)
      )
    LIMIT 1
    `,
    [offerName, productId, productId, categoryId, categoryId],
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
 * Fetch all usage entries for a specific offer.
 * @param {number|string} offerId - Offer identifier
 * @returns {Promise<Array>} Offer usage rows
 */
export const getOfferUsageByOfferId = async (offerId) => {
  const [result] = await pool.query(
    `SELECT ou.offer_id,
    om.offer_name,
    om.offer_type,
    om.discount_type,
    om.discount_value,
    ou.user_id,
    ou.order_id,
    ou.discount_amount,
    ou.usage_count,
    ou.created_at 
    FROM offer_usage AS ou 
    LEFT JOIN offer_master AS om
    ON om.offer_id=ou.offer_id 
    WHERE ou.offer_id=?`,
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
    `SELECT ou.offer_id,
    om.offer_name,
    om.offer_type,
    om.discount_type,
    om.discount_value,
    ou.user_id,
    ou.order_id,
    ou.discount_amount,
    ou.usage_count,
    ou.created_at 
    FROM offer_usage AS ou 
    LEFT JOIN offer_master AS om
    ON om.offer_id=ou.offer_id
    WHERE ou.user_id=?`,
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
    FROM offer_master om
    LEFT JOIN offer_usage ou
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
