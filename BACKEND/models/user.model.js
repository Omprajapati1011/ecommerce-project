import pool from "../configs/db.js";

export const createUserModel = async (data) => {
  const { name, email, password, created_by, role } = data;

  const sql = `
    INSERT INTO user_master (name, email, password, created_by, role)
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [name, email, password, created_by, role || "customer"]);

  return result;
};

export const loginUserModel = async (email) => {
  const sql = `SELECT * FROM user_master WHERE email = ? AND is_deleted = 0
  `;

  const [result] = await pool.query(sql, [email]);

  return result;
};

export const logoutUserModel = async (userId) => {
  const sql = `UPDATE user_master SET refresh_token = NULL WHERE user_id = ?`;

  const [result] = await pool.query(sql, [userId]);

  return result;
};

export const refreshTokenHelper = async (id, refreshToken) => {
  const sql = `SELECT * FROM user_master 
       WHERE user_id = ? AND refresh_token = ?`;

  const [result] = await pool.query(sql, [id, refreshToken]);

  return result;
};

//users can see their profile
export const viewUserModel = async (data) => {
  const sql = `SELECT 
    name,
    email,
    role,
    last_login,
    last_login AS lastLogin,
    created_at,
    updated_at
    FROM user_master
    WHERE user_id = ? AND is_deleted = 0`;

  const [result] = await pool.query(sql, [data]);

  return result;
};

//users can update their profile
export const updateProfileModel = async (data, userId) => {
  const sql = `
    UPDATE user_master
    SET ?, updated_at = NOW(), updated_by = ?
    WHERE user_id = ? AND is_deleted = 0
  `;

  const [result] = await pool.query(sql, [data, userId, userId]);
  return result;
};

//users can delete their account
export const deleteByUserModel = async (id) => {
  const sql = `UPDATE user_master SET is_deleted = true, updated_by = ? WHERE user_id = ?`;

  const [result] = await pool.query(sql, [id, id]);

  return result;
};

//users can update their password
export const getUserByIdforpassword = async (id) => {
  const [rows] = await pool.query(
    `SELECT password FROM user_master WHERE user_id = ?`,
    [id],
  );
  return rows[0]; // returns undefined if not found
};

export const updateUserPassword = async (id, newPassword) => {
  const [result] = await pool.query(
    `UPDATE user_master SET password = ? ,updated_by = ? WHERE user_id = ?`,
    [newPassword, id, id],
  );
  return result.affectedRows;
};

//admin can see all users
const USER_SORTABLE_COLUMNS = {
  user_id: "u.user_id",
  name: "u.name",
  email: "u.email",
  role: "u.role",
  is_blocked: "u.is_blocked",
  last_login: "u.last_login",
  created_at: "u.created_at",
};

const buildUserFilters = (userId, filters = {}) => {
  const where = ["u.is_deleted = 0", "u.user_id != ?"];
  const values = [userId];

  if (filters.search) {
    where.push("(u.name LIKE ? OR u.email LIKE ? OR u.role LIKE ?)");
    const term = `%${filters.search}%`;
    values.push(term, term, term);
  }

  if (filters.role) {
    where.push("u.role = ?");
    values.push(filters.role);
  }

  if (filters.status === "blocked") {
    where.push("u.is_blocked = 1");
  } else if (filters.status === "active") {
    where.push("u.is_blocked = 0");
  }

  return { whereClause: `WHERE ${where.join(" AND ")}`, values };
};

export const getAllUserCountModel = async (userId, filters = {}) => {
  const { whereClause, values } = buildUserFilters(userId, filters);
  const sql = `SELECT COUNT(*) AS total FROM user_master u ${whereClause};`;
  const [result] = await pool.query(sql, values);
  return result[0]?.total || 0;
};

export const getAllUserModel = async (
  userId,
  { limit = 10, offset = 0, sortField = "created_at", sortOrder = "desc" } = {},
  filters = {}
) => {
  const { whereClause, values } = buildUserFilters(userId, filters);
  const sortColumn = USER_SORTABLE_COLUMNS[sortField] || USER_SORTABLE_COLUMNS.created_at;
  const sortDirection = String(sortOrder).toLowerCase() === "asc" ? "ASC" : "DESC";

  const sql = `SELECT u.user_id, u.name, u.email, u.created_at, u.role, u.is_blocked, u.last_login
  FROM user_master u
  ${whereClause}
  ORDER BY ${sortColumn} ${sortDirection}
  LIMIT ? OFFSET ?;`;

  const [result] = await pool.query(sql, [...values, Number(limit), Number(offset)]);
  return result;
};

//admin can see user profile
export const getUserById = async (id) => {
  const sql = `SELECT name, email, role, created_at, last_login 
       FROM user_master 
       WHERE user_id = ? AND is_deleted = 0`;

  const [result] = await pool.query(sql, [id]);

  return result;
};

//admin can delete user
export const deleteUserByAdminModel = async (id, adminId) => {
  const sql = `UPDATE user_master SET is_deleted = true, updated_by = ? WHERE user_id = ?`;

  const [result] = await pool.query(sql, [adminId, id]);

  return result;
};

//admin can block user
export const blockUserById = async (userId, adminId) => {
  const sql = `UPDATE user_master SET is_blocked = 1, updated_by = ? WHERE user_id = ?`;

  const [result] = await pool.query(sql, [adminId, userId]);

  return result;
};

//admin can unblock user
export const unblockUserById = async (userId, adminId) => {
  const sql = `UPDATE user_master SET is_blocked=0,updated_by=? WHERE user_id=?`;

  const [result] = await pool.query(sql, [adminId, userId]);

  return result;
};
