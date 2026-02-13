import pool from "../configs/db.js";

export const addUserAddressModel = async (data) => {
  const sql = `INSERT INTO user_addresses SET ?`;

//   const [result] = await pool.query(sql, [data]);

  return result;
};

export const removeDefaultAddress = async (userId) => {
  const sql = `UPDATE user_addresses 
       SET is_default = 0 
       WHERE user_id = ? AND is_deleted = 0`;
  await pool.query(sql, [userId]);
};

export const setDefaultAddressModel = async (userId, addressId) => {
  const sql = `UPDATE user_addresses 
       SET is_default = 1, updated_at = NOW(), updated_by = ?
       WHERE address_id = ? 
       AND user_id = ? 
       AND is_deleted = 0`;

  const [result] = await pool.query(sql, [userId, addressId, userId]);

  return result;
};

export const getAllAddresses = async (userId) => {
  const sql = `SELECT address_id,
              full_name,
              phone,
              address_line1,
              address_line2,
              city,
              state,
              postal_code,
              country,
              is_default,
              created_at,
              updated_at
       FROM user_addresses
       WHERE user_id = ?
       AND is_deleted = 0
       ORDER BY is_default DESC, created_at DESC`;

  const [result] = await pool.query(sql, [userId]);

  return result;
};

export const updateAddressModel = async (data, addressId, userId) => {
  const sql = `UPDATE user_addresses
       SET ?
       WHERE address_id = ?
       AND user_id = ?
       AND is_deleted = 0`;

  const [result] = await pool.query(sql, [data, userId, addressId]);

  return result;
};

export const deleteAddressModel = async (addressId, userId) => {
  const sql = `UPDATE user_addresses
       SET is_deleted = 1,
           updated_at = NOW()
       WHERE address_id = ?
       AND user_id = ?
       AND is_deleted = 0`;

  const [result] = await pool.query(sql, [addressId, userId]);

  return result;
};

