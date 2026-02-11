import pool from "../configs/db.js";

// ============================================================================
// OFFER MODEL QUERIES
// ============================================================================

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
 * update offer by id (not deleted)
 * @param {number|string} offerId - Offer identifier
 */

export const updateOfferById = async (offerId, offerData) => {
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
    updated_by,
  } = offerData;
  const [result] = await pool.query(
    `UPDATE offer_master SET
      offer_name = ?,
      description = ?,
      offer_type = ?,
      discount_type = ?,
      discount_value = ?,
      maximum_discount_amount = ?,
      min_purchase_amount = ?,
      usage_limit_per_user = ?,
      category_id = ?,
      product_id = ?,
      start_date = ?,
      end_date = ?,
      start_time=?,
      end_time=?,
      is_active=?,
      updated_by = ?
    WHERE offer_id = ?
      AND is_deleted = 0;
`,
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
      updated_by,
      offerId,
    ],
  );
  return result;
};

/**
 * delete offer by id (not deleted)
 * @param {number|string} offerId - Offer identifier
 */

export const deleteOfferById = async (offerId) => {
  const [result] = await pool.query(
    `UPDATE offer_master SET is_deleted=1 WHERE offer_id=? AND is_deleted=0`,
    [offerId],
  );
  return result;
};

/**
 * update offer status by id (not deleted)
 * @param {number|string} offerId - Offer identifier
 */

export const activeupdateOfferStatusById = async (offerId, isActive) => {
  const [result] = await pool.query(
    `UPDATE offer_master SET is_active=? WHERE offer_id=? AND is_deleted=0`,
    [isActive, offerId],
  );
  return result;
};

/**
 * Fetch all active offers where is_active=1
 * @returns {Promise<Array>} activeOffer rows
 */

export const getActiveOffer=async()=>{
  const [result]=await pool.query(`SELECT * FROM offer_master WHERE is_active=1 AND is_deleted=0`)
  return result;
}


/**
 * Fetch all offer for product id
 * @returns {Promise<Array>} activeOffer rows
 */

export const getOfferByProductId=async(productID)=>{
  const [result]=await pool.query(`SELECT * FROM offer_master WHERE product_id=? AND is_deleted=0`,[productID])
  return result;
}
/**
 * Fetch all offer for product id
 * @returns {Promise<Array>} activeOffer rows
 */

export const getOfferByCategoryId=async(categoryID)=>{
  const [result]=await pool.query(`SELECT * FROM offer_master WHERE category_id=? AND is_deleted=0`,[categoryID])
  return result;
}

/**
 * Validate offer before applying
 * Checks: active, date, time, scope, min purchase, usage limit
 * @param {object} data
 * @returns {Promise<object>}
 */
// export const validateOffer=async(offerName,total,userId,productId,categoryId)=>{
// const [rows]=awit pool.query()
// }