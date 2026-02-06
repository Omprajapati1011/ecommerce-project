import pool from "../configs/db.js";

// ✅ Find user by email (login)
export const findByEmail = (email) => {
  return pool.query(
    `SELECT *
     FROM user_master
     WHERE email = ?
     AND is_deleted = 0`,
    [email],
  );
};

// ✅ Get user by id
export const getById = (userId) => {
  return pool.query(
    `SELECT *
     FROM user_master
     WHERE user_id = ?
     AND is_deleted = 0`,
    [userId],
  );
};

// ✅ Create user (register)
export const createUser = (data) => {
  return pool.query(
    `INSERT INTO user_master
     (name, email, password, role, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [data.name, data.email, data.password, data.role, data.created_by || null],
  );
};

// ✅ Update user
export const updateUser = (userId, data) => {
  return pool.query(
    `UPDATE user_master
     SET name = ?, email = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?
     AND is_deleted = 0`,
    [data.name, data.email, data.updated_by, userId],
  );
};

// ✅ Soft delete user (admin only usually)
export const deleteUser = (userId, adminId) => {
  return pool.query(
    `UPDATE user_master
     SET is_deleted = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [adminId, userId],
  );
};
