import db from "../configs/db.js";

const Product = {

  /* =========================
     Create Product
  ========================== */
  create: (data, conn = db) => {
    const sql = `
      INSERT INTO product_master
      (name, display_name, description, short_description,
       price, discounted_price, stock, category_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return conn.execute(sql, [
      data.name,
      data.display_name,
      data.description,
      data.short_description,
      data.price,
      data.discounted_price,
      data.stock ?? 0,
      data.category_id ?? null,
      data.created_by
    ]);
  },

  /* =========================
     Fetch Category + Parents
  ========================== */
  getCategoryWithParents: (categoryId, conn = db) => {
    const sql = `
      WITH RECURSIVE category_tree AS (
        SELECT category_id, parent_id
        FROM category_master
        WHERE category_id = ?

        UNION ALL

        SELECT c.category_id, c.parent_id
        FROM category_master c
        INNER JOIN category_tree ct
          ON ct.parent_id = c.category_id
      )
      SELECT category_id FROM category_tree
    `;

    return conn.execute(sql, [categoryId]);
  },

  /* =========================
     Insert Product Categories
  ========================== */
  insertProductCategories: (productId, categoryIds, conn = db) => {
    if (!categoryIds.length) return;

    const values = categoryIds.map(cid => [productId, cid]);

    const sql = `
      INSERT INTO product_categories (product_id, category_id)
      VALUES ?
    `;

    return conn.query(sql, [values]);
  },

  /* =========================
   Soft Delete Product
========================= */
softDelete: (productId, updatedBy, conn = db) => {
  const sql = `
    UPDATE product_master
    SET is_deleted = 1,
        is_active = 0,
        updated_by = ?
    WHERE product_id = ? AND is_deleted = 0
  `;

  return conn.execute(sql, [updatedBy, productId]);
}


};



export default Product;
