import pool from "../configs/db.js";

export const getAll = () => {
  return pool.query(`SELECT * FROM category_master WHERE is_deleted = 0`);
};

export const getById = (categoryId) => {
  const query = `
WITH RECURSIVE subcategories AS (
    -- start with root category
    SELECT *
    FROM category_master
    WHERE category_id = ? AND is_deleted = 0
    UNION ALL
    -- recursively find children
    SELECT cm.*
    FROM category_master cm
    INNER JOIN subcategories s
      ON cm.parent_id = s.category_id
    WHERE cm.is_deleted = 0
)
SELECT *
FROM subcategories;
`;

  return pool.query(query, [categoryId]);
};

export const getByCategory = (categoryId) => {
  const query = `
WITH RECURSIVE subcategories AS (
    SELECT category_id
    FROM category_master  
    WHERE category_id = ?
      AND is_deleted = 0
    UNION ALL
    SELECT cm.category_id
    FROM category_master cm
    JOIN subcategories s
        ON cm.parent_id = s.category_id
    WHERE cm.is_deleted = 0
)
SELECT DISTINCT pm.*
FROM product_master pm
JOIN product_categories pc
    ON pm.product_id = pc.product_id
WHERE pc.category_id IN (
    SELECT category_id FROM subcategories
)
AND pm.is_deleted = 0;
`;

  return pool.query(query, [categoryId]);
};
