import pool from "../configs/db.js";

export const registerUserModel = (data, callback) => {
  const { name, email, password, created_by } = data;

  const sql = ` INSERT INTO user_master (name, email, password, created_by)
    VALUES (?, ?, ?, ?)`;

  pool.query(sql, [name, email, password, created_by], (err, result) => {
    if (err) return callback(err);
    callback(null, [result]);
  });
};
