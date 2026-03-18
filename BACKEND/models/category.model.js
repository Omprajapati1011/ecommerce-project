import pool from "../configs/db.js";

export const getAll = () => {
  return pool.query(`SELECT * FROM category_master WHERE is_deleted = 0`);
};

export const getAllForTree = () => {
  return pool.query(`
    SELECT
      category_id,
      category_name,
      parent_id,
      is_deleted,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM category_master
    WHERE is_deleted = 0
    ORDER BY parent_id IS NOT NULL, parent_id, category_name
  `);
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

export const getByIds = (categoryIds) => {
  const placeholders = categoryIds.map(() => "?").join(", ");
  const query = `
    SELECT *
    FROM category_master
    WHERE category_id IN (${placeholders})
      AND is_deleted = 0
  `;

  return pool.query(query, categoryIds);
};

export const countRoot = () => {
  return pool.query(
    `SELECT COUNT(*) as total
     FROM category_master
     WHERE parent_id IS NULL
     AND is_deleted = 0`,
  );
};

export const getRootPaginated = (limit, offset) => {
  return pool.query(
    `SELECT *
     FROM category_master
     WHERE parent_id IS NULL
     AND is_deleted = 0
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
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
SELECT DISTINCT pm.*,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = pm.product_id
          AND pi.image_level = 'PRODUCT'
          AND pi.is_deleted = 0
        ORDER BY pi.is_primary DESC, pi.image_id DESC
        LIMIT 1) AS image_url
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

export const countProductsByCategoryIds = (categoryIds) => {
  const placeholders = categoryIds.map(() => "?").join(", ");
  const query = `
WITH RECURSIVE subcategories AS (
    SELECT category_id
    FROM category_master
    WHERE category_id IN (${placeholders})
      AND is_deleted = 0
    UNION ALL
    SELECT cm.category_id
    FROM category_master cm
    JOIN subcategories s
      ON cm.parent_id = s.category_id
    WHERE cm.is_deleted = 0
)
SELECT COUNT(DISTINCT pm.product_id) AS total
FROM product_master pm
JOIN product_categories pc
  ON pm.product_id = pc.product_id
WHERE pc.category_id IN (SELECT category_id FROM subcategories)
  AND pm.is_deleted = 0;
`;

  return pool.query(query, categoryIds);
};

export const getProductsByCategoryIdsPaginated = (
  categoryIds,
  limit,
  offset,
) => {
  const placeholders = categoryIds.map(() => "?").join(", ");
  const query = `
WITH RECURSIVE subcategories AS (
    SELECT category_id
    FROM category_master
    WHERE category_id IN (${placeholders})
      AND is_deleted = 0
    UNION ALL
    SELECT cm.category_id
    FROM category_master cm
    JOIN subcategories s
      ON cm.parent_id = s.category_id
    WHERE cm.is_deleted = 0
)
SELECT DISTINCT pm.*,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = pm.product_id
          AND pi.image_level = 'PRODUCT'
          AND pi.is_deleted = 0
        ORDER BY pi.is_primary DESC, pi.image_id DESC
        LIMIT 1) AS image_url
FROM product_master pm
JOIN product_categories pc
  ON pm.product_id = pc.product_id
WHERE pc.category_id IN (SELECT category_id FROM subcategories)
  AND pm.is_deleted = 0
ORDER BY pm.product_id DESC
LIMIT ?
OFFSET ?;
`;

  return pool.query(query, [...categoryIds, Number(limit), Number(offset)]);
};

export const getProductsByCategoryIds = (categoryIds) => {
  const placeholders = categoryIds.map(() => "?").join(", ");
  const query = `
WITH RECURSIVE subcategories AS (
    SELECT category_id
    FROM category_master
    WHERE category_id IN (${placeholders})
      AND is_deleted = 0
    UNION ALL
    SELECT cm.category_id
    FROM category_master cm
    JOIN subcategories s
      ON cm.parent_id = s.category_id
    WHERE cm.is_deleted = 0
)
SELECT DISTINCT pm.*,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = pm.product_id
          AND pi.image_level = 'PRODUCT'
          AND pi.is_deleted = 0
        ORDER BY pi.is_primary DESC, pi.image_id DESC
        LIMIT 1) AS image_url
FROM product_master pm
JOIN product_categories pc
  ON pm.product_id = pc.product_id
WHERE pc.category_id IN (SELECT category_id FROM subcategories)
  AND pm.is_deleted = 0
ORDER BY pm.product_id DESC;
`;

  return pool.query(query, categoryIds);
};

const buildProductSearchClause = (search) => {
  if (!search)
    return { clause: "", params: [], requiresCategoryNameJoin: false };
  const normalizedSearch = String(search)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "");
  if (!normalizedSearch)
    return { clause: "", params: [], requiresCategoryNameJoin: false };
  const like = `%${normalizedSearch}%`;
  return {
    clause: `(
      LOWER(REPLACE(COALESCE(pm.name, ''), ' ', '')) LIKE ?
      OR LOWER(REPLACE(COALESCE(pm.display_name, ''), ' ', '')) LIKE ?
      OR LOWER(REPLACE(COALESCE(pm.description, ''), ' ', '')) LIKE ?
      OR LOWER(REPLACE(COALESCE(pm.short_description, ''), ' ', '')) LIKE ?
      OR LOWER(REPLACE(COALESCE(cm.category_name, ''), ' ', '')) LIKE ?
      OR pm.category_id IN (
        SELECT child.category_id FROM category_master child
        WHERE child.parent_id IN (
          SELECT anc.category_id FROM category_master anc
          WHERE LOWER(REPLACE(COALESCE(anc.category_name, ''), ' ', '')) LIKE ?
        )
        UNION
        SELECT gc.category_id FROM category_master gc
        INNER JOIN category_master mid ON gc.parent_id = mid.category_id
        WHERE mid.parent_id IN (
          SELECT anc2.category_id FROM category_master anc2
          WHERE LOWER(REPLACE(COALESCE(anc2.category_name, ''), ' ', '')) LIKE ?
        )
      )
    )`,
    params: [like, like, like, like, like, like, like],
    requiresCategoryNameJoin: true,
  };
};

const buildCategoryFilterClause = (parentIds = [], childIds = []) => {
  const values = [];
  const clauses = [];

  if (parentIds.length) {
    const ph = parentIds.map(() => "?").join(", ");
    const descendantSubquery = `(
      SELECT category_id FROM category_master WHERE category_id IN (${ph}) AND is_deleted = 0
      UNION
      SELECT category_id FROM category_master WHERE parent_id IN (${ph}) AND is_deleted = 0
      UNION
      SELECT c3.category_id FROM category_master c3
        INNER JOIN category_master c2 ON c3.parent_id = c2.category_id
        WHERE c2.parent_id IN (${ph}) AND c3.is_deleted = 0 AND c2.is_deleted = 0
    )`;
    clauses.push(
      `(pc.category_id IN ${descendantSubquery} OR pm.category_id IN ${descendantSubquery})`
    );
    // 3 levels × 2 (pc + pm) = 6 copies
    values.push(
      ...parentIds, ...parentIds, ...parentIds,
      ...parentIds, ...parentIds, ...parentIds
    );
  }

  if (childIds.length) {
    const placeholders = childIds.map(() => "?").join(", ");
    clauses.push(`pm.category_id IN (${placeholders})`);
    values.push(...childIds);
  }

  return {
    clause: clauses.length ? `(${clauses.join(" OR ")})` : "",
    params: values,
    requiresCategoryJoin: parentIds.length > 0,
  };
};

const buildPriceFilterClause = (minPrice, maxPrice) => {
  const conditions = [];
  const params = [];

  if (Number.isFinite(minPrice)) {
    conditions.push("COALESCE(pm.discounted_price, pm.price) >= ?");
    params.push(Number(minPrice));
  }

  if (Number.isFinite(maxPrice)) {
    conditions.push("COALESCE(pm.discounted_price, pm.price) <= ?");
    params.push(Number(maxPrice));
  }

  return {
    clause: conditions.length ? `(${conditions.join(" AND ")})` : "",
    params,
  };
};

export const countProductsByCategoryFilter = (
  parentIds = [],
  childIds = [],
  search = "",
  minPrice,
  maxPrice,
) => {
  const conditions = ["pm.is_deleted = 0"];
  const values = [];

  const categoryFilter = buildCategoryFilterClause(parentIds, childIds);
  if (categoryFilter.clause) {
    conditions.push(categoryFilter.clause);
    values.push(...categoryFilter.params);
  }

  const searchFilter = buildProductSearchClause(search);
  if (searchFilter.clause) {
    conditions.push(searchFilter.clause);
    values.push(...searchFilter.params);
  }

  const priceFilter = buildPriceFilterClause(minPrice, maxPrice);
  if (priceFilter.clause) {
    conditions.push(priceFilter.clause);
    values.push(...priceFilter.params);
  }

  const joinClause = [
    categoryFilter.requiresCategoryJoin ? "LEFT JOIN product_categories pc ON pm.product_id = pc.product_id" : "",
    searchFilter.requiresCategoryNameJoin ? "LEFT JOIN category_master cm ON pm.category_id = cm.category_id" : "",
  ].filter(Boolean).join("\n    ");

  const query = `
    SELECT COUNT(DISTINCT pm.product_id) AS total
    FROM product_master pm
    ${joinClause}
    WHERE ${conditions.join(" AND ")}
  `;

  return pool.query(query, values);
};

export const getProductsByCategoryFilterPaginated = (
  parentIds = [],
  childIds = [],
  search = "",
  minPrice,
  maxPrice,
  limit,
  offset,
) => {
  const conditions = ["pm.is_deleted = 0"];
  const values = [];

  const categoryFilter = buildCategoryFilterClause(parentIds, childIds);
  if (categoryFilter.clause) {
    conditions.push(categoryFilter.clause);
    values.push(...categoryFilter.params);
  }

  const searchFilter = buildProductSearchClause(search);
  if (searchFilter.clause) {
    conditions.push(searchFilter.clause);
    values.push(...searchFilter.params);
  }

  const priceFilter = buildPriceFilterClause(minPrice, maxPrice);
  if (priceFilter.clause) {
    conditions.push(priceFilter.clause);
    values.push(...priceFilter.params);
  }

  const joinClause = [
    categoryFilter.requiresCategoryJoin ? "LEFT JOIN product_categories pc ON pm.product_id = pc.product_id" : "",
    searchFilter.requiresCategoryNameJoin ? "LEFT JOIN category_master cm ON pm.category_id = cm.category_id" : "",
  ].filter(Boolean).join("\n    ");

  const query = `
    SELECT DISTINCT pm.*,
           (SELECT pi.image_url FROM product_images pi
            WHERE pi.product_id = pm.product_id
              AND pi.image_level = 'PRODUCT'
              AND pi.is_deleted = 0
            ORDER BY pi.is_primary DESC, pi.image_id DESC
            LIMIT 1) AS image_url
    FROM product_master pm
    ${joinClause}
    WHERE ${conditions.join(" AND ")}
    ORDER BY pm.product_id DESC
    LIMIT ?
    OFFSET ?
  `;

  return pool.query(query, [...values, Number(limit), Number(offset)]);
};

export const getProductsByCategoryFilter = (
  parentIds = [],
  childIds = [],
  search = "",
  minPrice,
  maxPrice,
) => {
  const conditions = ["pm.is_deleted = 0"];
  const values = [];

  const categoryFilter = buildCategoryFilterClause(parentIds, childIds);
  if (categoryFilter.clause) {
    conditions.push(categoryFilter.clause);
    values.push(...categoryFilter.params);
  }

  const searchFilter = buildProductSearchClause(search);
  if (searchFilter.clause) {
    conditions.push(searchFilter.clause);
    values.push(...searchFilter.params);
  }

  const priceFilter = buildPriceFilterClause(minPrice, maxPrice);
  if (priceFilter.clause) {
    conditions.push(priceFilter.clause);
    values.push(...priceFilter.params);
  }

  const joinClause = [
    categoryFilter.requiresCategoryJoin ? "LEFT JOIN product_categories pc ON pm.product_id = pc.product_id" : "",
    searchFilter.requiresCategoryNameJoin ? "LEFT JOIN category_master cm ON pm.category_id = cm.category_id" : "",
  ].filter(Boolean).join("\n    ");

  const query = `
    SELECT DISTINCT pm.*,
           (SELECT pi.image_url FROM product_images pi
            WHERE pi.product_id = pm.product_id
              AND pi.image_level = 'PRODUCT'
              AND pi.is_deleted = 0
            ORDER BY pi.is_primary DESC, pi.image_id DESC
            LIMIT 1) AS image_url
    FROM product_master pm
    ${joinClause}
    WHERE ${conditions.join(" AND ")}
    ORDER BY pm.product_id DESC
  `;

  return pool.query(query, values);
};

export const getProductsPriceRangeByCategoryFilter = (
  parentIds = [],
  childIds = [],
  search = "",
) => {
  const conditions = ["pm.is_deleted = 0"];
  const values = [];

  const categoryFilter = buildCategoryFilterClause(parentIds, childIds);
  if (categoryFilter.clause) {
    conditions.push(categoryFilter.clause);
    values.push(...categoryFilter.params);
  }

  const searchFilter = buildProductSearchClause(search);
  if (searchFilter.clause) {
    conditions.push(searchFilter.clause);
    values.push(...searchFilter.params);
  }

  const joinClause = [
    categoryFilter.requiresCategoryJoin ? "LEFT JOIN product_categories pc ON pm.product_id = pc.product_id" : "",
    searchFilter.requiresCategoryNameJoin ? "LEFT JOIN category_master cm ON pm.category_id = cm.category_id" : "",
  ].filter(Boolean).join("\n    ");

  const query = `
    SELECT
      MIN(COALESCE(pm.discounted_price, pm.price)) AS min_price,
      MAX(COALESCE(pm.discounted_price, pm.price)) AS max_price
    FROM product_master pm
    ${joinClause}
    WHERE ${conditions.join(" AND ")}
  `;

  return pool.query(query, values);
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

/**
 * Toggle active status for a category and its entire subtree.
 * When deactivating (isActive=0), all child categories are also deactivated.
 * When activating (isActive=1), only the specified category is activated (children remain unchanged).
 */
export const toggleStatusSubtree = (categoryId, isActive, userId) => {
  // When activating, only update the specific category, not its children
  if (isActive === 1) {
    const query = `
      UPDATE category_master
      SET
        is_active = ?,
        updated_by = ?,
        updated_at = NOW()
      WHERE category_id = ?
        AND is_deleted = 0
    `;
    return pool.query(query, [isActive, userId, categoryId]);
  }

  // When deactivating, cascade to all descendants
  const query = `
    WITH RECURSIVE subtree AS (
      SELECT category_id
      FROM category_master
      WHERE category_id = ?
        AND is_deleted = 0

      UNION ALL

      SELECT cm.category_id
      FROM category_master cm
      JOIN subtree s ON cm.parent_id = s.category_id
      WHERE cm.is_deleted = 0
    )
    UPDATE category_master
    SET
      is_active = ?,
      updated_by = ?,
      updated_at = NOW()
    WHERE category_id IN (SELECT category_id FROM subtree)
      AND is_deleted = 0
  `;

  return pool.query(query, [categoryId, isActive, userId]);
};
