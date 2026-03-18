import pool from "../configs/db.js";

// Review model object for business-rule checks and review creation.
export const reviewModel = {
  // Check if product exists and is active.
  checkProductExists: async (product_id) => {
    const query = `
      SELECT product_id
      FROM product_master
      WHERE product_id = ?
        AND is_deleted = 0
        AND is_active = 1
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [product_id]);
    return rows.length > 0;
  },

  // Check if user purchased this product with delivered order.
  checkUserPurchased: async (user_id, product_id) => {
    const query = `
      SELECT om.order_id
      FROM order_master om
      INNER JOIN order_items oi ON oi.order_id = om.order_id
      WHERE om.user_id = ?
        AND om.order_status = 'delivered'
        AND om.is_deleted = 0
        AND oi.product_id = ?
        AND oi.is_deleted = 0
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [user_id, product_id]);
    return rows.length > 0;
  },

  // Check if provided order_id belongs to delivered purchase for this user/product.
  checkOrderForPurchase: async (order_id, user_id, product_id) => {
    const query = `
      SELECT om.order_id
      FROM order_master om
      INNER JOIN order_items oi ON oi.order_id = om.order_id
      WHERE om.order_id = ?
        AND om.user_id = ?
        AND om.order_status = 'delivered'
        AND om.is_deleted = 0
        AND oi.product_id = ?
        AND oi.is_deleted = 0
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [order_id, user_id, product_id]);
    return rows.length > 0;
  },

  // Check if user has already reviewed this product.
  checkAlreadyReviewed: async (user_id, product_id) => {
    const query = `
      SELECT review_id
      FROM product_reviews
      WHERE user_id = ?
        AND product_id = ?
        AND is_deleted = 0
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [user_id, product_id]);
    return rows.length > 0;
  },

  // Insert new review.
  create: async (data) => {
    const values = [
      data.product_id,
      data.user_id,
      data.order_id ?? null,
      data.rating,
      data.title ?? null,
      data.review_text ?? null,
      data.is_verified_purchase,
      data.created_by,
      data.updated_by,
    ];

    const query = `
      INSERT INTO product_reviews
      (
        product_id,
        user_id,
        order_id,
        rating,
        title,
        review_text,
        is_verified_purchase,
        helpful_count,
        is_deleted,
        created_by,
        updated_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.query(query, values);
    return result.insertId;
  },

  // Get review meta used for permission checks.
  getReviewMetaById: async (review_id) => {
    const query = `
      SELECT review_id, user_id, product_id, helpful_count
      FROM product_reviews
      WHERE review_id = ? AND is_deleted = 0
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [review_id]);
    return rows[0] || null;
  },
};

// Fetch paginated reviews for product with optional filters/sort.
export const getReviewsByProduct = async (
  product_id,
  filters,
  user_id = null,
) => {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.max(1, Math.min(100, Number(filters.limit || 10)));
  const offset = (page - 1) * limit;

  const whereClauses = ["pr.product_id = ?", "pr.is_deleted = 0"];
  const whereValues = [product_id];

  if (filters.rating !== undefined) {
    whereClauses.push("pr.rating = ?");
    whereValues.push(filters.rating);
  }

  if (filters.verified !== undefined) {
    whereClauses.push("pr.is_verified_purchase = ?");
    whereValues.push(filters.verified);
  }

  const sortMap = {
    newest: "pr.created_at DESC",
    helpful: "pr.helpful_count DESC, pr.created_at DESC",
    highest: "pr.rating DESC, pr.created_at DESC",
    lowest: "pr.rating ASC, pr.created_at DESC",
  };

  const sortBy = sortMap[filters.sort] || sortMap.newest;
  const whereSql = whereClauses.join(" AND ");

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM product_reviews pr
    WHERE ${whereSql}
  `;
  const [countRows] = await pool.query(countQuery, whereValues);
  const total = Number(countRows[0]?.total || 0);

  let listQuery = "";
  let listValues = [];

  // For authenticated users, include whether the user liked each review.
  if (user_id) {
    listQuery = `
      SELECT
        pr.review_id,
        pr.rating,
        pr.title,
        pr.review_text,
        pr.is_verified_purchase,
        pr.helpful_count,
        um.name AS reviewer_name,
        CASE WHEN rh.id IS NULL THEN false ELSE true END AS is_liked_by_me,
        pr.created_at
      FROM product_reviews pr
      INNER JOIN user_master um ON um.user_id = pr.user_id
      LEFT JOIN review_helpful rh
        ON rh.review_id = pr.review_id
       AND rh.user_id = ?
      WHERE ${whereSql}
      ORDER BY ${sortBy}
      LIMIT ? OFFSET ?
    `;
    listValues = [user_id, ...whereValues, limit, offset];
  } else {
    // For guests, always return is_liked_by_me as false.
    listQuery = `
      SELECT
        pr.review_id,
        pr.rating,
        pr.title,
        pr.review_text,
        pr.is_verified_purchase,
        pr.helpful_count,
        um.name AS reviewer_name,
        false AS is_liked_by_me,
        pr.created_at
      FROM product_reviews pr
      INNER JOIN user_master um ON um.user_id = pr.user_id
      WHERE ${whereSql}
      ORDER BY ${sortBy}
      LIMIT ? OFFSET ?
    `;
    listValues = [...whereValues, limit, offset];
  }

  let rows = [];
  try {
    const [resultRows] = await pool.query(listQuery, listValues);
    rows = resultRows;
  } catch (error) {
    // Fallback when review_helpful table is not created yet.
    if (error.code === "ER_NO_SUCH_TABLE" && user_id) {
      const fallbackQuery = `
        SELECT
          pr.review_id,
          pr.rating,
          pr.title,
          pr.review_text,
          pr.is_verified_purchase,
          pr.helpful_count,
          um.name AS reviewer_name,
          false AS is_liked_by_me,
          pr.created_at
        FROM product_reviews pr
        INNER JOIN user_master um ON um.user_id = pr.user_id
        WHERE ${whereSql}
        ORDER BY ${sortBy}
        LIMIT ? OFFSET ?
      `;
      const [fallbackRows] = await pool.query(fallbackQuery, [
        ...whereValues,
        limit,
        offset,
      ]);
      rows = fallbackRows;
    } else {
      throw error;
    }
  }

  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit) || 1,
    items: rows,
  };
};

// Get rating summary for product.
export const getProductRatingSummary = async (product_id) => {
  const summaryQuery = `
    SELECT
      ROUND(AVG(rating), 1) AS average_rating,
      COUNT(*) AS total_ratings,
      SUM(CASE WHEN review_text IS NOT NULL AND TRIM(review_text) <> '' THEN 1 ELSE 0 END) AS total_reviews
    FROM product_reviews
    WHERE product_id = ?
      AND is_deleted = 0
  `;

  const breakdownQuery = `
    SELECT rating, COUNT(*) AS count
    FROM product_reviews
    WHERE product_id = ?
      AND is_deleted = 0
    GROUP BY rating
  `;

  const [[summaryRows], [breakdownRows]] = await Promise.all([
    pool.query(summaryQuery, [product_id]),
    pool.query(breakdownQuery, [product_id]),
  ]);

  const summary = summaryRows[0] || {
    average_rating: 0,
    total_ratings: 0,
    total_reviews: 0,
  };

  const totalRatings = Number(summary.total_ratings || 0);

  const rating_breakdown = {
    5: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    1: { count: 0, percentage: 0 },
  };

  // Build 1-5 star breakdown with percentage.
  breakdownRows.forEach((row) => {
    const key = String(row.rating);
    const count = Number(row.count || 0);
    rating_breakdown[key] = {
      count,
      percentage:
        totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0,
    };
  });

  return {
    product_id,
    average_rating: Number(summary.average_rating || 0),
    total_ratings: totalRatings,
    total_reviews: Number(summary.total_reviews || 0),
    rating_breakdown,
  };
};

// Get rating summaries for multiple products.
export const getProductRatingSummariesBulk = async (product_ids) => {
  const uniqueIds = Array.from(
    new Set(
      (product_ids || [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );

  if (!uniqueIds.length) {
    return {};
  }

  const [validRows] = await pool.query(
    `
      SELECT product_id
      FROM product_master
      WHERE product_id IN (?)
        AND is_deleted = 0
        AND is_active = 1
    `,
    [uniqueIds],
  );

  const validIds = validRows.map((row) => Number(row.product_id));
  if (!validIds.length) {
    return {};
  }

  const summaryQuery = `
    SELECT
      product_id,
      ROUND(AVG(rating), 1) AS average_rating,
      COUNT(*) AS total_ratings,
      SUM(CASE WHEN review_text IS NOT NULL AND TRIM(review_text) <> '' THEN 1 ELSE 0 END) AS total_reviews
    FROM product_reviews
    WHERE product_id IN (?)
      AND is_deleted = 0
    GROUP BY product_id
  `;

  const breakdownQuery = `
    SELECT product_id, rating, COUNT(*) AS count
    FROM product_reviews
    WHERE product_id IN (?)
      AND is_deleted = 0
    GROUP BY product_id, rating
  `;

  const [[summaryRows], [breakdownRows]] = await Promise.all([
    pool.query(summaryQuery, [validIds]),
    pool.query(breakdownQuery, [validIds]),
  ]);

  const summaries = {};
  const emptyBreakdown = () => ({
    5: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    1: { count: 0, percentage: 0 },
  });

  validIds.forEach((productId) => {
    summaries[productId] = {
      product_id: productId,
      average_rating: 0,
      total_ratings: 0,
      total_reviews: 0,
      rating_breakdown: emptyBreakdown(),
    };
  });

  summaryRows.forEach((row) => {
    const productId = Number(row.product_id);
    if (!summaries[productId]) return;
    const totalRatings = Number(row.total_ratings || 0);
    summaries[productId].average_rating = Number(row.average_rating || 0);
    summaries[productId].total_ratings = totalRatings;
    summaries[productId].total_reviews = Number(row.total_reviews || 0);
  });

  breakdownRows.forEach((row) => {
    const productId = Number(row.product_id);
    if (!summaries[productId]) return;
    const key = String(row.rating);
    const count = Number(row.count || 0);
    summaries[productId].rating_breakdown[key] = {
      count,
      percentage: 0,
    };
  });

  Object.values(summaries).forEach((summary) => {
    const totalRatings = Number(summary.total_ratings || 0);
    Object.keys(summary.rating_breakdown).forEach((key) => {
      const entry = summary.rating_breakdown[key];
      entry.percentage =
        totalRatings > 0 ? Math.round((entry.count / totalRatings) * 100) : 0;
    });
  });

  return summaries;
};

// Fetch single review by id.
export const getReviewById = async (review_id) => {
  const query = `
    SELECT
      pr.review_id,
      pr.product_id,
      pm.name AS product_name,
      pr.user_id,
      um.name AS reviewer_name,
      pr.order_id,
      pr.rating,
      pr.title,
      pr.review_text,
      pr.is_verified_purchase,
      pr.helpful_count,
      pr.created_by,
      pr.updated_by,
      pr.created_at,
      pr.updated_at
    FROM product_reviews pr
    INNER JOIN user_master um ON um.user_id = pr.user_id
    INNER JOIN product_master pm ON pm.product_id = pr.product_id
    WHERE pr.review_id = ?
      AND pr.is_deleted = 0
    LIMIT 1
  `;

  const [rows] = await pool.query(query, [review_id]);
  return rows[0] || null;
};

// Update review fields (only provided fields are updated).
export const updateReview = async (review_id, data, updated_by) => {
  const fields = [];
  const values = [];

  if (data.rating !== undefined) {
    fields.push("rating = ?");
    values.push(data.rating);
  }

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }

  if (data.review_text !== undefined) {
    fields.push("review_text = ?");
    values.push(data.review_text);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push("updated_by = ?");
  values.push(updated_by);
  fields.push("updated_at = NOW()");

  values.push(review_id);

  const query = `
    UPDATE product_reviews
    SET ${fields.join(", ")}
    WHERE review_id = ?
      AND is_deleted = 0
  `;

  const [result] = await pool.query(query, values);
  return result.affectedRows > 0;
};

// Hard delete review.
export const hardDeleteReview = async (review_id) => {
  const query = `DELETE FROM product_reviews WHERE review_id = ?`;
  const [result] = await pool.query(query, [review_id]);
  return result.affectedRows > 0;
};

// Toggle helpful like/unlike for a review in a transaction.
export const toggleHelpful = async (review_id, user_id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [reviewRows] = await connection.query(
      `
      SELECT review_id, user_id AS owner_id
      FROM product_reviews
      WHERE review_id = ? AND is_deleted = 0
      LIMIT 1
      FOR UPDATE
      `,
      [review_id],
    );

    // Stop when review does not exist.
    if (reviewRows.length === 0) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    const [likedRows] = await connection.query(
      `
      SELECT id
      FROM review_helpful
      WHERE review_id = ? AND user_id = ?
      LIMIT 1
      `,
      [review_id, user_id],
    );

    let action = "liked";

    if (likedRows.length === 0) {
      await connection.query(
        `
        INSERT INTO review_helpful (review_id, user_id, created_at)
        VALUES (?, ?, NOW())
        `,
        [review_id, user_id],
      );

      await connection.query(
        `
        UPDATE product_reviews
        SET helpful_count = helpful_count + 1,
            updated_by = ?,
            updated_at = NOW()
        WHERE review_id = ? AND is_deleted = 0
        `,
        [user_id, review_id],
      );

      action = "liked";
    } else {
      await connection.query(
        `
        DELETE FROM review_helpful
        WHERE review_id = ? AND user_id = ?
        `,
        [review_id, user_id],
      );

      await connection.query(
        `
        UPDATE product_reviews
        SET helpful_count = GREATEST(helpful_count - 1, 0),
            updated_by = ?,
            updated_at = NOW()
        WHERE review_id = ? AND is_deleted = 0
        `,
        [user_id, review_id],
      );

      action = "unliked";
    }

    const [countRows] = await connection.query(
      `
      SELECT helpful_count
      FROM product_reviews
      WHERE review_id = ?
      LIMIT 1
      `,
      [review_id],
    );

    await connection.commit();

    return {
      action,
      helpful_count: Number(countRows[0]?.helpful_count || 0),
    };
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_NO_SUCH_TABLE") {
      throw new Error("HELPFUL_TABLE_MISSING");
    }
    throw error;
  } finally {
    connection.release();
  }
};

export const getAllReviewsAdmin = async ({
  page = 1,
  limit = 10,
  search = "",
  rating = null,
  sortField = "created_at",
  sortOrder = "desc",
} = {}) => {
  const offset = (Number(page) - 1) * Number(limit);
  const allowedSort = {
    created_at: "pr.created_at",
    rating: "pr.rating",
    helpful_count: "pr.helpful_count",
  };
  const orderCol = allowedSort[sortField] ?? "pr.created_at";
  const orderDir = sortOrder === "asc" ? "ASC" : "DESC";

  const params = [];
  const whereClauses = ["pr.is_deleted = 0"];

  if (search) {
    whereClauses.push("(pm.display_name LIKE ? OR um.name LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (rating) {
    whereClauses.push("pr.rating = ?");
    params.push(Number(rating));
  }

  const where = `WHERE ${whereClauses.join(" AND ")}`;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM product_reviews pr
    INNER JOIN product_master pm ON pm.product_id = pr.product_id
    INNER JOIN user_master um ON um.user_id = pr.user_id
    ${where}
  `;

  const dataSql = `
    SELECT pr.review_id, pr.rating, pr.title, pr.review_text,
           pr.is_verified_purchase, pr.helpful_count, pr.created_at,
           pm.display_name AS product_name, pm.product_id,
           um.name AS reviewer_name, um.user_id
    FROM product_reviews pr
    INNER JOIN product_master pm ON pm.product_id = pr.product_id
    INNER JOIN user_master um ON um.user_id = pr.user_id
    ${where}
    ORDER BY ${orderCol} ${orderDir}
    LIMIT ? OFFSET ?
  `;

  const [countRows] = await pool.query(countSql, [...params]);
  const [rows] = await pool.query(dataSql, [...params, Number(limit), offset]);

  return {
    items: rows,
    total: Number(countRows[0]?.total || 0),
    page: Number(page),
    limit: Number(limit),
  };
};
