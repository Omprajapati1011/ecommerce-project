import pool from "../configs/db.js";

import mysql from "mysql2/promise";

const PAYMENT_STATUS_TRANSITIONS = {
  pending: ["processing", "completed", "failed", "refunded"],
  processing: ["completed", "failed", "refunded"],
  completed: ["refunded"],
  failed: ["processing", "completed"],
  refunded: [],
};

const CANCEL_REQUEST_STATUSES = new Set(["pending", "approved", "rejected"]);
let ensureCancelRequestTablePromise = null;

const ensureCancelRequestTable = async () => {
  if (!ensureCancelRequestTablePromise) {
    ensureCancelRequestTablePromise = pool.execute(`
      CREATE TABLE IF NOT EXISTS order_cancel_requests (
        request_id INT NOT NULL AUTO_INCREMENT,
        order_id INT NOT NULL,
        user_id INT NOT NULL,
        reason TEXT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        admin_note TEXT NULL,
        reviewed_by INT NULL,
        reviewed_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (request_id),
        KEY idx_order_cancel_requests_order_id (order_id),
        KEY idx_order_cancel_requests_user_id (user_id),
        KEY idx_order_cancel_requests_status (status),
        CONSTRAINT fk_order_cancel_requests_order
          FOREIGN KEY (order_id) REFERENCES order_master(order_id) ON DELETE CASCADE,
        CONSTRAINT fk_order_cancel_requests_user
          FOREIGN KEY (user_id) REFERENCES user_master(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_order_cancel_requests_reviewed_by
          FOREIGN KEY (reviewed_by) REFERENCES user_master(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  await ensureCancelRequestTablePromise;
};

// Fetch cart items for a user including product and portion details
export const getCart = async (user_id) => {
  const [cart] = await pool.query(
    `select ci.cart_item_id, ci.product_id,cm.cart_id,
        ci.quantity,
        ci.product_portion_id, 
        ci.modifier_id
         from cart_items ci join cart_master cm on ci.cart_id  = cm.cart_id  where cm.user_id =? and ci.is_deleted=0`,
    [user_id],
  );

  if (cart.length > 0) {
    const cartItemIds = cart.map((c) => c.cart_item_id);
    const [modifierRows] = await pool.query(
      `SELECT cim.cart_item_id, cim.modifier_id 
       FROM cart_item_modifiers cim 
       WHERE cim.cart_item_id IN (?)`,
      [cartItemIds]
    );
    const modMap = {};
    modifierRows.forEach((m) => {
      if (!modMap[m.cart_item_id]) modMap[m.cart_item_id] = [];
      modMap[m.cart_item_id].push(m.modifier_id);
    });
    cart.forEach((c) => {
      const multi = modMap[c.cart_item_id] || [];
      if (c.modifier_id && !multi.includes(c.modifier_id)) {
        multi.push(c.modifier_id);
      }
      c.modifier_ids = multi;
    });
  }

  return cart;
};

// Find primary category for each product
export const getCompareProductCategory = async (productIds) => {
  const [compare] = await pool.query(
    `select product_id,min(category_id) as category_id from
                                        product_categories where product_id in (?)
                                        group by product_id`,
    [productIds],
  );
  return compare;
};

// Retrieve user's default address ID
export const getUserAddress = async (user_id) => {
  const [rows] = await pool.query(
    "select address_id  from user_addresses  where user_id= ?",
    [user_id],
  );
  return rows[0]?.address_id || null;
};

// Fetch product-level discounts from offer master
export const getOfferOnCart = async (userId) => {
  const [rows] = await pool.query(
    "select offer_id from cart_master where user_id = ?",
    [userId],
  );
  return rows;
};
export const getOfferItem = async (cart_id) => {
  const [rows] = await pool.query(
    "select offer_id from cart_items where cart_id = ? ",
    [cart_id],
  );
  return rows;
};
// Insert order into order_master and generate order number
export const insertValue = async (values) => {
  const [rows] = await pool.query(
    ` insert into order_master (order_number,user_id,address_id,
        subtotal,tax_amount,shipping_amount,discount_amount,
        total_amount,order_status ,payment_status, is_deleted,created_by,updated_by)
        values (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    values,
  );

  const order_number = `ORD-200${rows.insertId}`;

  const inserted = await pool.query(
    "UPDATE order_master SET order_number=? WHERE order_id=?",
    [order_number, rows.insertId],
  );
  return rows;
};

// Retrieve all orders for a specific user with pagination and safe sorting
export const getAllOrder = async (
  userId,
  limit,
  offset,
  sortField = "created_at",
  sortOrder = "DESC",
) => {
  await ensureCancelRequestTable();

  const sortableColumns = {
    order_id: "order_id",
    order_number: "order_number",
    order_status: "order_status",
    payment_status: "payment_status",
    created_at: "created_at",
    total_amount: "total_amount",
  };

  const orderBy = sortableColumns[sortField] || "created_at";
  const direction = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  const [rows] = await pool.query(
    `SELECT
       om.*,
       (
         SELECT ocr.status
         FROM order_cancel_requests ocr
         WHERE ocr.order_id = om.order_id
         ORDER BY ocr.created_at DESC, ocr.request_id DESC
         LIMIT 1
       ) AS cancel_request_status,
        (
          SELECT ocr.request_id
          FROM order_cancel_requests ocr
          WHERE ocr.order_id = om.order_id
          ORDER BY ocr.created_at DESC, ocr.request_id DESC
          LIMIT 1
        ) AS cancel_request_id,
        (
          SELECT ocr.reason
          FROM order_cancel_requests ocr
          WHERE ocr.order_id = om.order_id
          ORDER BY ocr.created_at DESC, ocr.request_id DESC
          LIMIT 1
        ) AS cancel_request_reason,
        (
          SELECT ocr.admin_note
          FROM order_cancel_requests ocr
          WHERE ocr.order_id = om.order_id
          ORDER BY ocr.created_at DESC, ocr.request_id DESC
          LIMIT 1
        ) AS cancel_request_admin_note,
        (
          SELECT ocr.reviewed_at
          FROM order_cancel_requests ocr
          WHERE ocr.order_id = om.order_id
          ORDER BY ocr.created_at DESC, ocr.request_id DESC
          LIMIT 1
        ) AS cancel_request_reviewed_at,
        (
          SELECT ocr.created_at
          FROM order_cancel_requests ocr
          WHERE ocr.order_id = om.order_id
          ORDER BY ocr.created_at DESC, ocr.request_id DESC
          LIMIT 1
        ) AS cancel_request_created_at
     FROM order_master om
     WHERE user_id = ? AND is_deleted = 0
     ORDER BY ${orderBy} ${direction}
     LIMIT ? OFFSET ?`,
    [userId, limit, offset],
  );
  return rows;
};

// Count all orders for a specific user
export const countAllOrder = async (userId) => {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as total FROM order_master WHERE user_id = ? AND is_deleted = 0",
    [userId],
  );
  return rows[0].total;
};

// Get price for a specific product portion
export const getPortionPrice = async (productId, portionId) => {
  const [rows] = await pool.query(
    "select price from product_portion where product_id=? and product_portion_id=?",
    [productId, portionId],
  );
  return rows;
};

// Fetch product master details (name, price, category) for given product IDs
export const getProducts = async (productsIds) => {
  const [products] = await pool.query(
    `SELECT name,price,product_id, category_id FROM product_master WHERE product_id IN (?)`,
    [productsIds],
  );
  return products;
};

// Get portion values for portions used in order items
export const getPortionValue = async (portionIds) => {
  const [rows] = await pool.query(
    "select portion_id, portion_value from portion_master where portion_id in (?)",
    [portionIds],
  );
  return rows;
};

// Get modifier values for modifiers used in order items
export const getModifierValue = async (modifierIds) => {
  if (!modifierIds || modifierIds.length === 0) return [];
  const [rows] = await pool.query(
    "select modifier_id, modifier_value, modifier_name, modifier_type, additional_price from modifier_master where modifier_id in (?)",
    [modifierIds],
  );
  return rows;
};

// Find root category using recursive query for tax classification
export const getRootCategoryId = async (categoryId) => {
  const query = `
  WITH RECURSIVE cat_tree AS (
      SELECT category_id, parent_id
      FROM category_master
      WHERE category_id = ?

      UNION ALL

      SELECT c.category_id, c.parent_id
      FROM category_master c
      JOIN cat_tree ct
          ON c.category_id = ct.parent_id
  )
  SELECT category_id
  FROM cat_tree
  WHERE parent_id IS NULL;
  `;

  const [rows] = await pool.query(query, [categoryId]);
  return rows;
};

// Fetch category-level discounts from offer master
export const getDisCountOnCat = async (categoryId) => {
  const [rows] = await pool.query(
    `select discount_value, discount_type, category_id from offer_master where category_id= ? `,
    [categoryId],
  );
  return rows;
};

// Get discount value for a specific offer id
export const getOfferOnId = async (offer_id) => {
  const [rows] = await pool.query(
    "SELECT discount_value FROM offer_master WHERE offer_id = ?",
    [offer_id],
  );

  return rows[0]?.discount_value || null;
};

// Get offer details (type and value)
export const getOfferDetails = async (offer_id) => {
  const [rows] = await pool.query(
    "SELECT discount_type, discount_value FROM offer_master WHERE offer_id = ?",
    [offer_id],
  );
  return rows;
};

// Get single order by id (for ownership checks)
export const getOrderById = async (order_id) => {
  const [rows] = await pool.query(
    "SELECT order_id, user_id, order_number, order_status, payment_status, total_amount, created_at FROM order_master WHERE order_id = ? AND is_deleted = 0",
    [order_id],
  );
  return rows[0] || null;
};

export const getLatestCancelRequestForOrder = async (orderId) => {
  await ensureCancelRequestTable();

  const [rows] = await pool.execute(
    `
      SELECT ocr.*
      FROM order_cancel_requests ocr
      WHERE ocr.order_id = ?
      ORDER BY ocr.created_at DESC, ocr.request_id DESC
      LIMIT 1
    `,
    [orderId],
  );

  return rows[0] || null;
};

export const createCancelRequest = async ({
  orderId,
  userId,
  reason = null,
}) => {
  await ensureCancelRequestTable();

  const [existingRows] = await pool.execute(
    `
      SELECT request_id, status
      FROM order_cancel_requests
      WHERE order_id = ? AND user_id = ? AND status = 'pending'
      ORDER BY created_at DESC, request_id DESC
      LIMIT 1
    `,
    [orderId, userId],
  );

  if (existingRows[0]) {
    return { reason: "ALREADY_PENDING", data: existingRows[0] };
  }

  const [result] = await pool.execute(
    `
      INSERT INTO order_cancel_requests (order_id, user_id, reason, status)
      VALUES (?, ?, ?, 'pending')
    `,
    [orderId, userId, reason ? String(reason).trim() : null],
  );

  const [rows] = await pool.execute(
    `
      SELECT ocr.*, om.order_number, om.order_status, om.payment_status, om.total_amount
      FROM order_cancel_requests ocr
      JOIN order_master om ON om.order_id = ocr.order_id
      WHERE ocr.request_id = ?
      LIMIT 1
    `,
    [result.insertId],
  );

  return { reason: null, data: rows[0] || null };
};

export const getCancelRequestsAdmin = async ({
  status,
  limit = 100,
} = {}) => {
  await ensureCancelRequestTable();

  const conditions = [];
  const values = [];

  if (status && CANCEL_REQUEST_STATUSES.has(String(status).toLowerCase())) {
    conditions.push("ocr.status = ?");
    values.push(String(status).toLowerCase());
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

  const [rows] = await pool.execute(
    `
      SELECT
        ocr.request_id,
        ocr.order_id,
        ocr.user_id,
        ocr.reason,
        ocr.status,
        ocr.admin_note,
        ocr.reviewed_by,
        ocr.reviewed_at,
        ocr.created_at,
        ocr.updated_at,
        om.order_number,
        om.order_status,
        om.payment_status,
        om.total_amount,
        u.name AS customer_name,
        u.email AS customer_email,
        reviewer.name AS reviewed_by_name
      FROM order_cancel_requests ocr
      JOIN order_master om ON om.order_id = ocr.order_id AND om.is_deleted = 0
      JOIN user_master u ON u.user_id = ocr.user_id
      LEFT JOIN user_master reviewer ON reviewer.user_id = ocr.reviewed_by
      ${whereClause}
      ORDER BY
        CASE WHEN ocr.status = 'pending' THEN 0 ELSE 1 END,
        ocr.created_at DESC,
        ocr.request_id DESC
      LIMIT ${safeLimit}
    `,
    values,
  );

  return rows;
};

export const reviewCancelRequest = async ({
  requestId,
  action,
  reviewedBy,
  adminNote = null,
}) => {
  await ensureCancelRequestTable();

  const normalizedAction = String(action || "").toLowerCase();
  if (!["approve", "reject"].includes(normalizedAction)) {
    return { affectedRows: 0, reason: "INVALID_ACTION" };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.execute(
      `
        SELECT
          ocr.request_id,
          ocr.order_id,
          ocr.user_id,
          ocr.status,
          om.order_status,
          om.order_number
        FROM order_cancel_requests ocr
        JOIN order_master om ON om.order_id = ocr.order_id AND om.is_deleted = 0
        WHERE ocr.request_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [requestId],
    );

    const request = requestRows[0];
    if (!request) {
      await connection.rollback();
      return { affectedRows: 0, reason: "NOT_FOUND" };
    }

    if (String(request.status).toLowerCase() !== "pending") {
      await connection.rollback();
      return { affectedRows: 0, reason: "ALREADY_REVIEWED" };
    }

    if (normalizedAction === "approve") {
      const currentOrderStatus = String(request.order_status || "").toLowerCase();
      if (!["pending", "processing"].includes(currentOrderStatus)) {
        await connection.rollback();
        return {
          affectedRows: 0,
          reason: "ORDER_NOT_CANCELABLE",
          order_status: currentOrderStatus,
        };
      }

      await connection.execute(
        `
          UPDATE order_master
          SET order_status = 'cancelled',
              updated_at = NOW(),
              updated_by = ?
          WHERE order_id = ?
        `,
        [reviewedBy, request.order_id],
      );
    }

    await connection.execute(
      `
        UPDATE order_cancel_requests
        SET status = ?,
            admin_note = ?,
            reviewed_by = ?,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE request_id = ?
      `,
      [
        normalizedAction === "approve" ? "approved" : "rejected",
        adminNote ? String(adminNote).trim() : null,
        reviewedBy,
        requestId,
      ],
    );

    await connection.commit();

    return {
      affectedRows: 1,
      status: normalizedAction === "approve" ? "approved" : "rejected",
      order_status:
        normalizedAction === "approve" ? "cancelled" : request.order_status,
      order_id: request.order_id,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Hardened updateOrderStatus (supports audit and optional ownership check)
export const updateOrderStatus = async (
  order_id,
  status,
  updated_by = null,
  ownerUserId = null,
) => {
  const params = [];
  const setParts = ["order_status = ?", "updated_at = NOW()"];
  params.push(status);

  if (updated_by !== null) {
    setParts.push("updated_by = ?");
    params.push(updated_by);
  }

  let sql = `UPDATE order_master SET ${setParts.join(", ")} WHERE order_id = ?`;
  params.push(order_id);

  if (ownerUserId !== null) {
    sql += " AND user_id = ?";
    params.push(ownerUserId);
  }

  const [result] = await pool.query(sql, params);
  return result; // caller should check result.affectedRows
};

// Optional: enforce allowed transitions inside model (recommended)
const ORDER_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["completed", "returned"],
  completed: [],
  cancelled: [],
  returned: [],
};

export const updateOrderStatusWithTransition = async (
  order_id,
  newStatus,
  updated_by = null,
  ownerUserId = null,
) => {
  // validate status
  if (!Object.prototype.hasOwnProperty.call(ORDER_TRANSITIONS, newStatus)) {
    return { affectedRows: 0, reason: "INVALID_STATUS" };
  }

  // fetch current status + optional owner check
  const [rowsFetch] = await pool.query(
    "SELECT order_status, user_id FROM order_master WHERE order_id = ? AND is_deleted = 0",
    [order_id],
  );
  const row = rowsFetch[0];
  if (!row) return { affectedRows: 0, reason: "NOT_FOUND" };

  if (ownerUserId !== null && row.user_id !== ownerUserId) {
    return { affectedRows: 0, reason: "NOT_OWNER" };
  }

  const current = row.order_status;
  if (current === newStatus) return { affectedRows: 0, reason: "NO_CHANGE" };

  const allowed = ORDER_TRANSITIONS[current] || [];
  if (!allowed.includes(newStatus)) {
    return { affectedRows: 0, reason: "INVALID_TRANSITION", allowed };
  }

  // perform update
  const params = [];
  const setParts = ["order_status = ?", "updated_at = NOW()"];
  params.push(newStatus);

  if (updated_by !== null) {
    setParts.push("updated_by = ?");
    params.push(updated_by);
  }

  let sql = `UPDATE order_master SET ${setParts.join(", ")} WHERE order_id = ?`;
  params.push(order_id);

  if (ownerUserId !== null) {
    sql += " AND user_id = ?";
    params.push(ownerUserId);
  }

  const [result] = await pool.query(sql, params);
  return result; // check result.affectedRows and/or combine with earlier reasons if needed
};

// Soft-delete an order
export const setOrderDeleted = async (order_id) => {
  const [rows] = await pool.query(
    `UPDATE order_master SET is_deleted = 1 WHERE order_id = ?`,
    [order_id],
  );
  return rows;
};

// Admin: fetch all orders with pagination
export const getAllOrdersAdmin = async (
  limit,
  offset,
  sortField = "created_at",
  sortOrder = "DESC",
) => {
  const sortableColumns = {
    order_id: "order_id",
    order_number: "order_number",
    order_status: "order_status",
    payment_status: "payment_status",
    created_at: "created_at",
    total_amount: "total_amount",
  };

  const orderBy = sortableColumns[sortField] || "created_at";
  const direction = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  const [rows] = await pool.query(
    `SELECT * FROM order_master
   WHERE is_deleted = 0
   ORDER BY ${orderBy} ${direction}
   LIMIT ? OFFSET ?`,
    [limit, offset],
  );

  return rows;
};

// Admin: count all orders
export const countAllOrdersAdmin = async () => {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as total FROM order_master WHERE is_deleted = 0",
  );
  return rows[0].total;
};

// Admin: get count of items grouped by product
export const getAllItemsByCountAdmin = async () => {
  const [rows] = await pool.query(
    `SELECT product_id, COUNT(*) as count FROM order_items GROUP BY product_id`,
  );
  return rows;
};

// Admin: fetch all order items
export const getAllItemsAdmin = async () => {
  const [rows] = await pool.query(`SELECT * FROM order_items`);
  return rows;
};

/**
 * Admin: Paginated order listing with user, address, and payment data.
 *
 * Joins order_master with user_master, user_addresses, and payment_master
 * to provide a single enriched result set for the admin orders table.
 *
 * Supports:
 *  - Search (order_number, customer name, customer email)
 *  - Filters (order_status, payment_status, payment_method, date range)
 *  - Sorting with whitelisted column map to prevent SQL injection
 *  - Pagination (limit/offset)
 *  - Global stats (total counts by order_status, unaffected by filters)
 *
 * @param {Object} filters - Dynamic WHERE clause parameters
 * @param {string} [filters.search] - Free-text search across order_number, user name, email
 * @param {string} [filters.order_status] - Filter by order_status enum value
 * @param {string} [filters.payment_status] - Filter by payment_status enum value
 * @param {string} [filters.payment_method] - Filter by payment_master.payment_method
 * @param {string} [filters.date_from] - ISO date string for range start (inclusive)
 * @param {string} [filters.date_to] - ISO date string for range end (inclusive, extended to 23:59:59)
 * @param {Object} pagination - Pagination and sorting parameters
 * @param {number} pagination.limit - Max rows per page
 * @param {number} pagination.offset - Row offset
 * @param {string} [pagination.sortField] - Column key from whitelist
 * @param {string} [pagination.sortOrder] - "asc" or "desc"
 * @returns {Promise<{total: number, data: Array, stats: Object}>}
 */
export const findAllOrdersAdmin = async (filters = {}, pagination = {}) => {
  await ensureCancelRequestTable();

  // Stats — always reflect all non-deleted orders
  const [statsRows] = await pool.execute(`
      SELECT
        COUNT(*) AS totalOrders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) AS totalPending,
        SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) AS totalProcessing,
        SUM(CASE WHEN order_status = 'shipped' THEN 1 ELSE 0 END) AS totalShipped,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) AS totalDelivered,
        SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) AS totalCompleted,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS totalCancelled,
        SUM(CASE WHEN order_status = 'refunded' THEN 1 ELSE 0 END) AS totalRefunded
      FROM order_master
      WHERE is_deleted = 0
    `);
  const stats = statsRows[0];

  const conditions = ["o.is_deleted = 0"];
  const values = [];

  const baseSql = `
      FROM order_master o
      LEFT JOIN user_master u ON o.user_id = u.user_id
      LEFT JOIN user_addresses a ON o.address_id = a.address_id
      LEFT JOIN payment_master p ON p.order_id = o.order_id AND p.is_deleted = 0
    `;

  // Search by order_number, customer name, or email
  if (filters.search) {
    conditions.push(
      "(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)",
    );
    values.push(
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`,
    );
  }

  // Filter by order_status
  if (filters.order_status) {
    conditions.push("o.order_status = ?");
    values.push(filters.order_status);
  }

  // Filter by payment_status
  if (filters.payment_status) {
    conditions.push("o.payment_status = ?");
    values.push(filters.payment_status);
  }

  // Filter by payment_method
  if (filters.payment_method) {
    conditions.push("p.payment_method = ?");
    values.push(filters.payment_method);
  }

  // Date range
  if (filters.date_from) {
    conditions.push("o.created_at >= ?");
    values.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push("o.created_at <= ?");
    values.push(filters.date_to + " 23:59:59");
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  // Count
  const [countRows] = await pool.execute(
    `SELECT COUNT(DISTINCT o.order_id) AS total ${baseSql} ${whereClause}`,
    values,
  );
  const total = countRows[0].total;

  // Pagination
  const limit = Number(pagination.limit) || 10;
  const offset = Number(pagination.offset) || 0;

  // Sorting — whitelist
  const sortableColumns = {
    order_id: "o.order_id",
    order_number: "o.order_number",
    customer_name: "u.name",
    total_amount: "o.total_amount",
    order_status: "o.order_status",
    payment_status: "o.payment_status",
    created_at: "o.created_at",
  };

  let orderClause = "ORDER BY o.order_id DESC";
  if (pagination.sortField && sortableColumns[pagination.sortField]) {
    const dir = pagination.sortOrder === "asc" ? "ASC" : "DESC";
    orderClause = `ORDER BY ${sortableColumns[pagination.sortField]} ${dir}`;
  }

  const dataSql = `
      SELECT DISTINCT o.*,
             u.name AS customer_name, u.email AS customer_email,
             a.full_name AS shipping_name, a.city AS shipping_city, a.state AS shipping_state,
             p.payment_id, p.payment_method, p.status AS payment_gateway_status,
             p.transaction_id, p.is_refunded, p.refund_amount,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id AND oi.is_deleted = 0) AS item_count,
             (
               SELECT ocr.status
               FROM order_cancel_requests ocr
               WHERE ocr.order_id = o.order_id
               ORDER BY ocr.created_at DESC, ocr.request_id DESC
               LIMIT 1
             ) AS cancel_request_status,
             (
               SELECT ocr.request_id
               FROM order_cancel_requests ocr
               WHERE ocr.order_id = o.order_id
               ORDER BY ocr.created_at DESC, ocr.request_id DESC
               LIMIT 1
             ) AS cancel_request_id
      ${baseSql}
      ${whereClause}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;

  const [dataRows] = await pool.execute(dataSql, values);

  return { total, data: dataRows, stats };
};

/**
 * Admin: Fetch a single order with full details for the order detail modal.
 *
 * Runs 3 separate queries to avoid cartesian product issues:
 *  1. Order + user + shipping address (LEFT JOINs)
 *  2. All order items (sorted by order_item_id)
 *  3. All payment records (sorted by created_at DESC)
 *
 * @param {number} orderId - The order_id to fetch
 * @returns {Promise<Object|null>} Combined order object with items[] and payments[], or null if not found
 */
export const getOrderDetailAdmin = async (orderId) => {
  await ensureCancelRequestTable();

  // Order + user + address
  const [orderRows] = await pool.execute(
    `
      SELECT o.*,
             u.name AS customer_name, u.email AS customer_email,
             a.full_name AS shipping_name, a.phone AS shipping_phone,
             a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country
      FROM order_master o
      LEFT JOIN user_master u ON o.user_id = u.user_id
      LEFT JOIN user_addresses a ON o.address_id = a.address_id
      WHERE o.order_id = ? AND o.is_deleted = 0
    `,
    [orderId],
  );

  if (!orderRows.length) return null;

  // Order items
  const [itemRows] = await pool.execute(
    `
      SELECT * FROM order_items
      WHERE order_id = ? AND is_deleted = 0
      ORDER BY order_item_id ASC
    `,
    [orderId],
  );

  // Fetch multiple modifiers if they exist
  if (itemRows.length > 0) {
    const orderItemIds = itemRows.map(i => i.order_item_id);
    const [modifierRows] = await pool.query(
      `SELECT * FROM order_item_modifiers WHERE order_item_id IN (?)`,
      [orderItemIds]
    );
    const modMap = {};
    modifierRows.forEach(m => {
       if (!modMap[m.order_item_id]) modMap[m.order_item_id] = [];
       modMap[m.order_item_id].push(m);
    });
    itemRows.forEach(item => {
       item.modifiers = modMap[item.order_item_id] || [];
       if (item.modifiers.length === 0 && item.modifier_value) {
          item.modifiers.push({
             modifier_id: item.modifier_id,
             modifier_name: null,
             modifier_value: item.modifier_value,
             additional_price: 0
          });
       }
    });
  }

  // Payments
  const [paymentRows] = await pool.execute(
    `
      SELECT * FROM payment_master
      WHERE order_id = ? AND is_deleted = 0
      ORDER BY created_at DESC
    `,
    [orderId],
  );

  return {
    ...orderRows[0],
    items: itemRows,
    payments: paymentRows,
    cancel_request: await getLatestCancelRequestForOrder(orderId),
  };
};

const syncOrderPaymentFields = async (
  executor,
  orderId,
  paymentStatus,
  updatedBy = null,
) => {
  const setParts = ["payment_status = ?", "updated_at = NOW()"];
  const values = [paymentStatus];

  if (paymentStatus === "refunded") {
    setParts.push(
      "order_status = CASE WHEN order_status IN ('cancelled', 'refunded') THEN order_status ELSE 'refunded' END",
    );
  }

  if (updatedBy !== null) {
    setParts.push("updated_by = ?");
    values.push(updatedBy);
  }

  values.push(orderId);

  await executor.execute(
    `UPDATE order_master SET ${setParts.join(", ")} WHERE order_id = ? AND is_deleted = 0`,
    values,
  );
};

export const syncOrderPaymentStatus = async (
  orderId,
  paymentStatus,
  updatedBy = null,
) => {
  await syncOrderPaymentFields(pool, orderId, paymentStatus, updatedBy);
};

/**
 * Admin: Manually update the payment_status column on order_master.
 *
 * Used when admin needs to override payment status (e.g., marking a
 * bank transfer as completed). Also updates the updated_at timestamp.
 *
 * @param {number} orderId - The order_id to update
 * @param {string} paymentStatus - New status (pending|processing|completed|failed|refunded)
 * @returns {Promise<Object>} MySQL result with affectedRows
 */
export const updatePaymentStatusAdmin = async (
  orderId,
  paymentStatus,
  updatedBy = null,
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.execute(
      `
        SELECT o.order_id, o.order_status, o.payment_status, p.payment_id, p.payment_method, p.status AS payment_record_status
        FROM order_master o
        LEFT JOIN payment_master p
          ON p.order_id = o.order_id
         AND p.is_deleted = 0
        WHERE o.order_id = ? AND o.is_deleted = 0
        ORDER BY p.created_at DESC, p.payment_id DESC
        LIMIT 1
      `,
      [orderId],
    );

    const order = orderRows[0];
    if (!order) {
      await connection.rollback();
      return { affectedRows: 0, reason: "NOT_FOUND" };
    }

    const currentPaymentStatus = String(
      order.payment_record_status || order.payment_status || "pending",
    ).toLowerCase();
    const nextPaymentStatus = String(paymentStatus || "").toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(PAYMENT_STATUS_TRANSITIONS, nextPaymentStatus)) {
      await connection.rollback();
      return { affectedRows: 0, reason: "INVALID_STATUS" };
    }

    if (String(order.payment_method || "").toLowerCase() === "stripe") {
      await connection.rollback();
      return {
        affectedRows: 0,
        reason: "STRIPE_MANAGED",
        payment_status: currentPaymentStatus,
        order_status: order.order_status,
      };
    }

    if (currentPaymentStatus === nextPaymentStatus) {
      await connection.rollback();
      return {
        affectedRows: 0,
        reason: "NO_CHANGE",
        payment_status: currentPaymentStatus,
        order_status: order.order_status,
      };
    }

    const allowedTransitions =
      PAYMENT_STATUS_TRANSITIONS[currentPaymentStatus] || [];
    if (!allowedTransitions.includes(nextPaymentStatus)) {
      await connection.rollback();
      return {
        affectedRows: 0,
        reason: "INVALID_TRANSITION",
        payment_status: currentPaymentStatus,
        order_status: order.order_status,
      };
    }

    if (
      nextPaymentStatus === "completed" &&
      order.payment_method === "cash_on_delivery" &&
      !["delivered", "completed"].includes(String(order.order_status).toLowerCase())
    ) {
      await connection.rollback();
      return {
        affectedRows: 0,
        reason: "COD_NOT_DELIVERED",
        payment_status: currentPaymentStatus,
        order_status: order.order_status,
      };
    }

    if (
      nextPaymentStatus === "refunded" &&
      !["delivered", "completed", "cancelled", "refunded"].includes(
        String(order.order_status).toLowerCase(),
      )
    ) {
      await connection.rollback();
      return {
        affectedRows: 0,
        reason: "INVALID_REFUND_STATE",
        payment_status: currentPaymentStatus,
        order_status: order.order_status,
      };
    }

    if (order.payment_id) {
      const paymentSetParts = ["status = ?", "updated_at = NOW()"];
      const paymentValues = [nextPaymentStatus];

      if (nextPaymentStatus === "processing") {
        paymentSetParts.push("processing_started_at = NOW()");
      }
      if (nextPaymentStatus === "completed") {
        paymentSetParts.push("succeeded_at = NOW()");
      }
      if (nextPaymentStatus === "failed") {
        paymentSetParts.push("failed_at = NOW()");
      }
      if (nextPaymentStatus === "refunded") {
        paymentSetParts.push("is_refunded = 1");
        paymentSetParts.push("refund_amount = amount");
      }
      if (updatedBy !== null) {
        paymentSetParts.push("updated_by = ?");
        paymentValues.push(updatedBy);
      }

      paymentValues.push(order.payment_id);

      await connection.execute(
        `UPDATE payment_master SET ${paymentSetParts.join(", ")} WHERE payment_id = ?`,
        paymentValues,
      );
    }

    await syncOrderPaymentFields(connection, orderId, nextPaymentStatus, updatedBy);

    await connection.commit();

    return {
      affectedRows: 1,
      payment_status: nextPaymentStatus,
      order_status:
        nextPaymentStatus === "refunded" &&
        !["cancelled", "refunded"].includes(String(order.order_status).toLowerCase())
          ? "refunded"
          : order.order_status,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
