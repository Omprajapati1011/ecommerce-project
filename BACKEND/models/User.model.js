import pool from "../configs/db.js";

export const createUserModel = async (data) => {
  const { name, email, password, created_by } = data;

  const sql = `
    INSERT INTO user_master (name, email, password, created_by)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [name, email, password, created_by]);

  return result;
};

export const loginUserModel = async (email) => {
  const sql = `SELECT * FROM user_master WHERE email = ? AND is_deleted = 0
  `;

  const [result] = await pool.query(sql, [email]);

  return result;
};

//users can see their profile
export const viewUserModel = async (data) => {
  const sql = `SELECT name, email FROM user_master WHERE user_id = ?`;

  const [result] = await pool.query(sql, [data]);

  return result;
};

//users can update their profile
export const updateProfileModel = async (data, userId) => {
  const sql = `
    UPDATE user_master
    SET ?, updated_at = NOW()
    WHERE user_id = ? AND is_deleted = 0
  `;

  const [result] = await pool.query(sql, [data, userId]);
  return result;
};

//users can delete their account
export const deleteByUserModel = async (id) => {
  const sql = `UPDATE user_master SET is_deleted = true WHERE user_id = ?`;

  const [result] = await pool.query(sql, [id]);

  return result;
};

//users can update their password
export const getUserByIdforpassword = async (id) => {
  const [rows] = await pool.query(
    `SELECT password FROM user_master WHERE user_id = ?`,
    [id]
  );
  return rows[0]; // returns undefined if not found
};

export const updateUserPassword = async (id, newPassword) => {
  const [result] = await pool.query(
    `UPDATE user_master SET password = ? WHERE user_id = ?`,
    [newPassword, id]
  );
  return result.affectedRows;
};

//admin can see all users
export const getAllUserModel = async () => {
  const sql = `SELECT name,email,created_at FROM user_master WHERE is_deleted = 0`;

  const [result] = await pool.query(sql);

  return result;
};

//admin can see user profile
export const getUserById = async (id) => {
  const sql = `SELECT name, email, role, created_at, last_login 
       FROM user_master 
       WHERE user_id = ? AND is_deleted = false`;

  const [result] = await pool.query(sql, [id]);

  return result;
};

//admin can delete user
export const deleteUserByAdminModel = async (id) => {
  const sql = `Update user_master SET is_deleted = true WHERE user_id = ?`;

  const [result] = await pool.query(sql, [id]);

  return result;
};
