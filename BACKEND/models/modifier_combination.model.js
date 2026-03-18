// modifier_combination.model.js
// Handles the modifier_combination + modifier_combination_items tables.
// Each combination represents a specific set of modifiers (e.g. "Black + 8 GB")
// with its own stock and additional_price.

import pool from "../configs/db.js";

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all active combinations for a given product_portion_id,
 * with their modifier items embedded as a JSON array.
 */
async function getCombinationsByPortionId(product_portion_id) {
  const [rows] = await pool.query(
    `SELECT
       mc.combination_id,
       mc.product_id,
       mc.product_portion_id,
       mc.name,
       mc.additional_price,
       mc.stock,
       mc.is_active,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'modifier_id',    mm.modifier_id,
           'modifier_type',  mm.modifier_type,
           'modifier_name',  mm.modifier_name,
           'modifier_value', mm.modifier_value
         )
       ) AS modifiers
     FROM modifier_combination mc
     JOIN modifier_combination_items mci ON mci.combination_id = mc.combination_id
     JOIN modifier_master mm ON mm.modifier_id = mci.modifier_id AND mm.is_deleted = 0
     WHERE mc.product_portion_id = ?
       AND mc.is_deleted = 0
     GROUP BY mc.combination_id
     ORDER BY mc.combination_id`,
    [product_portion_id],
  );

  return rows.map((r) => ({
    ...r,
    modifiers: typeof r.modifiers === "string" ? JSON.parse(r.modifiers) : (r.modifiers ?? []),
  }));
}

/**
 * Returns all active combinations for a product with no portions.
 */
async function getCombinationsByProductId(product_id) {
  const [rows] = await pool.query(
    `SELECT
       mc.combination_id,
       mc.product_id,
       mc.product_portion_id,
       mc.name,
       mc.additional_price,
       mc.stock,
       mc.is_active,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'modifier_id',    mm.modifier_id,
           'modifier_type',  mm.modifier_type,
           'modifier_name',  mm.modifier_name,
           'modifier_value', mm.modifier_value
         )
       ) AS modifiers
     FROM modifier_combination mc
     JOIN modifier_combination_items mci ON mci.combination_id = mc.combination_id
     JOIN modifier_master mm ON mm.modifier_id = mci.modifier_id AND mm.is_deleted = 0
     WHERE mc.product_id = ?
       AND mc.product_portion_id IS NULL
       AND mc.is_deleted = 0
     GROUP BY mc.combination_id
     ORDER BY mc.combination_id`,
    [product_id],
  );

  return rows.map((r) => ({
    ...r,
    modifiers: typeof r.modifiers === "string" ? JSON.parse(r.modifiers) : (r.modifiers ?? []),
  }));
}

/**
 * Returns a single combination by ID (including modifiers array).
 */
async function getCombinationById(combination_id) {
  const [rows] = await pool.query(
    `SELECT
       mc.combination_id,
       mc.product_id,
       mc.product_portion_id,
       mc.name,
       mc.additional_price,
       mc.stock,
       mc.is_active,
       mc.is_deleted,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'modifier_id',    mm.modifier_id,
           'modifier_type',  mm.modifier_type,
           'modifier_name',  mm.modifier_name,
           'modifier_value', mm.modifier_value
         )
       ) AS modifiers
     FROM modifier_combination mc
     JOIN modifier_combination_items mci ON mci.combination_id = mc.combination_id
     JOIN modifier_master mm ON mm.modifier_id = mci.modifier_id AND mm.is_deleted = 0
     WHERE mc.combination_id = ?
     GROUP BY mc.combination_id`,
    [combination_id],
  );

  if (!rows[0]) return null;
  const r = rows[0];
  return {
    ...r,
    modifiers: typeof r.modifiers === "string" ? JSON.parse(r.modifiers) : (r.modifiers ?? []),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a combination and its modifier items in one transaction.
 * @param {object} opts
 * @param {number}   opts.product_id
 * @param {number|null} opts.product_portion_id
 * @param {string}   opts.name               - e.g. "Black + 8 GB"
 * @param {number}   opts.additional_price
 * @param {number}   opts.stock
 * @param {number[]} opts.modifier_ids        - array of modifier_master IDs
 * @param {number}   opts.created_by
 * @returns {number} new combination_id
 */
async function createCombination({
  product_id,
  product_portion_id = null,
  name,
  additional_price = 0,
  stock = 0,
  modifier_ids = [],
  created_by,
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO modifier_combination
         (product_id, product_portion_id, name, additional_price, stock, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product_id, product_portion_id ?? null, name, additional_price, stock, created_by],
    );
    const combination_id = result.insertId;

    if (modifier_ids.length > 0) {
      const itemValues = modifier_ids.map((mid) => [combination_id, mid]);
      await conn.query(
        `INSERT INTO modifier_combination_items (combination_id, modifier_id) VALUES ?`,
        [itemValues],
      );
    }

    await conn.commit();
    return combination_id;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Updates name, additional_price, stock, or is_active for a combination.
 */
async function updateCombination(
  combination_id,
  { name, additional_price, stock, is_active, updated_by },
) {
  await pool.query(
    `UPDATE modifier_combination
        SET name              = COALESCE(?, name),
            additional_price  = COALESCE(?, additional_price),
            stock             = COALESCE(?, stock),
            is_active         = COALESCE(?, is_active),
            updated_by        = ?
      WHERE combination_id = ? AND is_deleted = 0`,
    [name ?? null, additional_price ?? null, stock ?? null, is_active ?? null, updated_by, combination_id],
  );
  return true;
}

/**
 * Soft-deletes a combination (does NOT delete items — ON DELETE CASCADE handles physical deletes).
 */
async function deleteCombination(combination_id, deleted_by) {
  await pool.query(
    `UPDATE modifier_combination
        SET is_deleted = 1, updated_by = ?
      WHERE combination_id = ? AND is_deleted = 0`,
    [deleted_by, combination_id],
  );
  return true;
}

/**
 * Atomically decrements stock by qty.
 * Returns true if successful, false if insufficient stock.
 */
async function decrementCombinationStock(combination_id, qty = 1) {
  const [result] = await pool.query(
    `UPDATE modifier_combination
        SET stock = stock - ?
      WHERE combination_id = ?
        AND is_deleted = 0
        AND is_active  = 1
        AND stock >= ?`,
    [qty, combination_id, qty],
  );
  return result.affectedRows > 0;
}

/**
 * Increments stock (for order cancellations / restocking).
 */
async function incrementCombinationStock(combination_id, qty = 1) {
  await pool.query(
    `UPDATE modifier_combination SET stock = stock + ? WHERE combination_id = ? AND is_deleted = 0`,
    [qty, combination_id],
  );
  return true;
}

export {
  getCombinationsByPortionId,
  getCombinationsByProductId,
  getCombinationById,
  createCombination,
  updateCombination,
  deleteCombination,
  decrementCombinationStock,
  incrementCombinationStock,
};
