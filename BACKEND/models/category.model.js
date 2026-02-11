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

export const searchByName = (categoryName, limit, offset) => {
  const query = `SELECT *
     FROM category_master
     WHERE category_name LIKE ?
       AND is_deleted = 0
     LIMIT ?
     OFFSET ?`;
  return pool.query(query, [
    `%${categoryName}%`,
    Number(limit),
    Number(offset),
  ]);
};

export const countByName = (categoryName) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM category_master
    WHERE category_name LIKE ?
      AND is_deleted = 0
  `;

  return pool.query(query, [`%${categoryName}%`]);
};

export const create = (name, parentId, userId) => {
  const query = `
    INSERT INTO category_master
    (category_name, parent_id, created_by)
    VALUES (?, ?, ?)
  `;
  return pool.query(query, [name, parentId || null, userId]);
};

export const findByName = (name) => {
  return pool.query(
    `SELECT category_id 
     FROM category_master 
     WHERE category_name = ? AND is_deleted = 0`,
    [name],
  );
};

export const findById = (id) => {
  return pool.query(
    `SELECT category_id 
     FROM category_master 
     WHERE category_id = ? AND is_deleted = 0`,
    [id],
  );
};

export const getChildrenIdsOnly = (categoryId) => {
  const query = `
  WITH RECURSIVE children AS (
      SELECT category_id
      FROM category_master
      WHERE parent_id = ? AND is_deleted = 0

      UNION ALL

      SELECT cm.category_id
      FROM category_master cm
      JOIN children c
        ON cm.parent_id = c.category_id
      WHERE cm.is_deleted = 0
  )
  SELECT category_id FROM children;
  `;

  return pool.query(query, [categoryId]);
};

export const update = (id, name, parentId, userId) => {
  const query = `
    UPDATE category_master
    SET
      category_name = ?,
      parent_id = ?,
      updated_by = ?,
      updated_at = NOW()
    WHERE category_id = ?
      AND is_deleted = 0
      AND (
        category_name <> ?
        OR IFNULL(parent_id, 0) <> IFNULL(?, 0)
      )
  `;

  return pool.query(query, [
    name,
    parentId,
    userId,
    id,
    name, // compare
    parentId, // compare
  ]);
};

// export const getSubtreeIds = (categoryId) => {
//   const query = `
//   WITH RECURSIVE subtree AS (
//       SELECT category_id
//       FROM category_master
//       WHERE category_id = ? AND is_deleted = 0

//       UNION ALL

//       SELECT cm.category_id
//       FROM category_master cm
//       JOIN subtree s ON cm.parent_id = s.category_id
//       WHERE cm.is_deleted = 0
//   )
//   SELECT category_id FROM subtree;
//   `;

//   return pool.query(query, [categoryId]);
// };

// export const softDeleteMany = (ids, userId) => {
//   const query = `
//     UPDATE category_master
//     SET
//       is_deleted = 1,
//       updated_by = ?,
//       updated_at = NOW()
//     WHERE category_id IN (?)
//   `;

//   return pool.query(query, [userId, ids]);
// };

export const softDeleteSubtree = (categoryId, userId) => {
  const query = `
  WITH RECURSIVE subtree AS (
      SELECT category_id
      FROM category_master
      WHERE category_id = ?

      UNION ALL

      SELECT cm.category_id
      FROM category_master cm
      JOIN subtree s ON cm.parent_id = s.category_id
  )
  UPDATE category_master
SET
    is_deleted = 1,
    updated_by = ?,
    updated_at = NOW()
WHERE category_id IN (SELECT category_id FROM subtree)
AND is_deleted = 0;
  `;

  return pool.query(query, [categoryId, userId]);
};

export const restoreSubtree = (categoryId, userId) => {
  const query = `
  WITH RECURSIVE subtree AS (
      SELECT category_id
      FROM category_master
      WHERE category_id = ?

      UNION ALL

      SELECT cm.category_id
      FROM category_master cm
      JOIN subtree s ON cm.parent_id = s.category_id
  )
  UPDATE category_master
SET
    is_deleted = 0,
    updated_by = ?,
    updated_at = NOW()
WHERE category_id IN (SELECT category_id FROM subtree)
AND is_deleted = 1;

  `;

  return pool.query(query, [categoryId, userId]);
};
