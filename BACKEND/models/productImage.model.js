import db from "../configs/db.js";

// Check product exists.
export const findProductById = async (productId) => {
  const [rows] = await db.execute(
    `SELECT product_id FROM product_master WHERE product_id = ? LIMIT 1`,
    [productId],
  );
  return rows[0] || null;
};

// Check product portion belongs to product.
export const findProductPortion = async (productPortionId, productId) => {
  const [rows] = await db.execute(
    `
      SELECT product_portion_id, product_id
      FROM product_portion
      WHERE product_portion_id = ? AND product_id = ?
      LIMIT 1
    `,
    [productPortionId, productId],
  );
  return rows[0] || null;
};

// Fetch modifier portion with parent product relation.
export const findModifierPortion = async (modifierPortionId) => {
  const [rows] = await db.execute(
    `
      SELECT
        mp.modifier_portion_id,
        mp.product_portion_id,
        COALESCE(mp.product_id, pp.product_id) AS product_id
      FROM modifier_portion mp
      LEFT JOIN product_portion pp ON pp.product_portion_id = mp.product_portion_id
      WHERE mp.modifier_portion_id = ?
        AND mp.is_deleted = 0
      LIMIT 1
    `,
    [modifierPortionId],
  );
  return rows[0] || null;
};

// Insert image metadata row.
export const createProductImage = async (payload, conn = db) => {
  const [result] = await conn.execute(
    `
      INSERT INTO product_images (
        product_id,
        product_portion_id,
        modifier_portion_id,
        image_level,
        image_url,
        public_id,
        is_primary,
        created_by,
        updated_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.product_id,
      payload.product_portion_id,
      payload.modifier_portion_id,
      payload.image_level,
      payload.image_url,
      payload.public_id,
      payload.is_primary,
      payload.created_by,
      payload.updated_by,
    ],
  );

  return result.insertId;
};

// List all active images for product.
export const getProductImagesByProductId = async (productId) => {
  const [rows] = await db.execute(
    `
      SELECT *
      FROM product_images
      WHERE product_id = ? AND is_deleted = 0
      ORDER BY is_primary DESC, image_id DESC
    `,
    [productId],
  );

  return rows;
};

// Find best image using VARIANT -> PORTION -> MODIFIER -> PRODUCT priority.
export const getVariantImageWithPriority = async (
  productId,
  productPortionId,
  modifierPortionId,
) => {
  const [rows] = await db.execute(
    `
      SELECT *
      FROM product_images
      WHERE product_id = ?
        AND is_deleted = 0
        AND (
          (image_level = 'VARIANT' AND ? IS NOT NULL AND ? IS NOT NULL
            AND product_portion_id = ? AND modifier_portion_id = ?)
          OR (image_level = 'PORTION' AND ? IS NOT NULL AND product_portion_id = ?)
          OR (image_level = 'MODIFIER' AND ? IS NOT NULL AND modifier_portion_id = ?)
          OR (image_level = 'PRODUCT')
        )
      ORDER BY
        CASE
          WHEN image_level = 'VARIANT' AND ? IS NOT NULL AND ? IS NOT NULL
            AND product_portion_id = ? AND modifier_portion_id = ? THEN 1
          WHEN image_level = 'PORTION' AND ? IS NOT NULL AND product_portion_id = ? THEN 2
          WHEN image_level = 'MODIFIER' AND ? IS NOT NULL AND modifier_portion_id = ? THEN 3
          WHEN image_level = 'PRODUCT' THEN 4
          ELSE 5
        END,
        is_primary DESC,
        image_id DESC
      LIMIT 1
    `,
    [
      productId,
      productPortionId,
      modifierPortionId,
      productPortionId,
      modifierPortionId,
      productPortionId,
      productPortionId,
      modifierPortionId,
      modifierPortionId,
      productPortionId,
      modifierPortionId,
      productPortionId,
      modifierPortionId,
      productPortionId,
      productPortionId,
      modifierPortionId,
      modifierPortionId,
    ],
  );

  return rows[0] || null;
};

// Fetch one active image by id.
export const getImageById = async (imageId) => {
  const [rows] = await db.execute(
    `SELECT * FROM product_images WHERE image_id = ? AND is_deleted = 0 LIMIT 1`,
    [imageId],
  );
  return rows[0] || null;
};

// Reset all primary flags for a product.
export const clearPrimaryByProductId = async (productId, userId, conn = db) => {
  await conn.execute(
    `
      UPDATE product_images
      SET is_primary = 0, updated_by = ?
      WHERE product_id = ? AND is_deleted = 0
    `,
    [userId, productId],
  );
};

// Set one image as primary.
export const setPrimaryByImageId = async (imageId, userId, conn = db) => {
  await conn.execute(
    `
      UPDATE product_images
      SET is_primary = 1, updated_by = ?
      WHERE image_id = ? AND is_deleted = 0
      LIMIT 1
    `,
    [userId, imageId],
  );
};

// Update editable fields and optional image URL/public id for existing image.
export const updateProductImageById = async (
  imageId,
  {
    product_portion_id,
    modifier_portion_id,
    image_level,
    image_url,
    public_id,
    is_primary,
    updated_by,
  },
  conn = db,
) => {
  const [result] = await conn.execute(
    `
      UPDATE product_images
      SET
        product_portion_id = ?,
        modifier_portion_id = ?,
        image_level = ?,
        image_url = ?,
        public_id = ?,
        is_primary = ?,
        updated_by = ?
      WHERE image_id = ? AND is_deleted = 0
      LIMIT 1
    `,
    [
      product_portion_id,
      modifier_portion_id,
      image_level,
      image_url,
      public_id,
      is_primary,
      updated_by,
      imageId,
    ],
  );

  return result;
};

// Soft delete image row.
export const softDeleteImageById = async (imageId, userId, conn = db) => {
  const [result] = await conn.execute(
    `
      UPDATE product_images
      SET is_deleted = 1, updated_by = ?
      WHERE image_id = ? AND is_deleted = 0
      LIMIT 1
    `,
    [userId, imageId],
  );

  return result;
};
