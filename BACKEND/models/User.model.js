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
  const sql = `SELECT * FROM user_master WHERE email = ?
  `;

  const [result] = await pool.query(sql, [email]);

  return result;
};
