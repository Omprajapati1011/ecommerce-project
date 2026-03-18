/**
 * @module SettingsModel
 * @description Database operations for application settings.
 * Stores key-value pairs for various configuration options.
 */
import pool from "../configs/db.js";

const SettingsModel = {
  /**
   * Get all settings grouped by category
   * @returns {Promise<Object>} Settings object grouped by category
   */
  async getAllSettings() {
    const [rows] = await pool.execute(`
      SELECT setting_key, setting_value, setting_type, category, description
      FROM app_settings
      WHERE is_deleted = 0
      ORDER BY category, setting_key
    `);

    // Group by category
    const grouped = {};
    rows.forEach((row) => {
      if (!grouped[row.category]) {
        grouped[row.category] = {};
      }
      grouped[row.category][row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        description: row.description,
      };
    });

    return grouped;
  },

  /**
   * Get settings by category
   * @param {string} category - Settings category
   * @returns {Promise<Object>} Settings for the category
   */
  async getSettingsByCategory(category) {
    const [rows] = await pool.execute(`
      SELECT setting_key, setting_value, setting_type, description
      FROM app_settings
      WHERE category = ? AND is_deleted = 0
    `, [category]);

    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        description: row.description,
      };
    });

    return settings;
  },

  /**
   * Get a single setting value
   * @param {string} key - Setting key
   * @returns {Promise<string|null>} Setting value or null
   */
  async getSetting(key) {
    const [rows] = await pool.execute(`
      SELECT setting_value
      FROM app_settings
      WHERE setting_key = ? AND is_deleted = 0
    `, [key]);

    return rows.length > 0 ? rows[0].setting_value : null;
  },

  /**
   * Update a setting
   * @param {string} key - Setting key
   * @param {string} value - New value
   * @param {number} userId - User making the update
   * @returns {Promise<boolean>} Success status
   */
  async updateSetting(key, value, userId) {
    const [result] = await pool.execute(`
      UPDATE app_settings
      SET setting_value = ?, updated_by = ?, updated_at = NOW()
      WHERE setting_key = ? AND is_deleted = 0
    `, [value, userId, key]);

    return result.affectedRows > 0;
  },

  /**
   * Update multiple settings
   * @param {Object} settings - Key-value pairs to update
   * @param {number} userId - User making the update
   * @returns {Promise<number>} Number of settings updated
   */
  async updateSettings(settings, userId) {
    const connection = await pool.getConnection();
    let updated = 0;

    try {
      await connection.beginTransaction();

      for (const [key, value] of Object.entries(settings)) {
        const [result] = await connection.execute(`
          UPDATE app_settings
          SET setting_value = ?, updated_by = ?, updated_at = NOW()
          WHERE setting_key = ? AND is_deleted = 0
        `, [value, userId, key]);

        if (result.affectedRows > 0) {
          updated++;
        }
      }

      await connection.commit();
      return updated;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Create a new setting
   * @param {Object} data - Setting data
   * @returns {Promise<number>} Insert ID
   */
  async createSetting(data) {
    const { setting_key, setting_value, setting_type, category, description, userId } = data;

    const [result] = await pool.execute(`
      INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [setting_key, setting_value, setting_type || 'string', category, description, userId, userId]);

    return result.insertId;
  },

  /**
   * Delete a setting (soft delete)
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} Success status
   */
  async deleteSetting(key) {
    const [result] = await pool.execute(`
      UPDATE app_settings
      SET is_deleted = 1
      WHERE setting_key = ?
    `, [key]);

    return result.affectedRows > 0;
  },

  /**
   * Get system information
   * @returns {Promise<Object>} System info
   */
  async getSystemInfo() {
    const [dbInfo] = await pool.execute(`
      SELECT
        VERSION() AS mysql_version,
        DATABASE() AS database_name,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()) AS table_count
    `);

    const [tableStats] = await pool.execute(`
      SELECT
        table_name,
        table_rows,
        ROUND(data_length / 1024 / 1024, 2) AS size_mb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY table_rows DESC
      LIMIT 10
    `);

    return {
      database: dbInfo[0],
      tables: tableStats,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  },

  /**
   * Get activity logs
   * @param {number} limit - Number of logs to return
   * @returns {Promise<Array>} Activity logs
   */
  async getActivityLogs(limit = 50) {
    const [rows] = await pool.execute(`
      SELECT
        al.*,
        um.name AS user_name,
        um.email AS user_email
      FROM activity_logs al
      LEFT JOIN user_master um ON al.user_id = um.user_id
      ORDER BY al.created_at DESC
      LIMIT ${parseInt(limit)}
    `);

    return rows;
  },

  /**
   * Log an activity
   * @param {Object} data - Activity data
   * @returns {Promise<number>} Insert ID
   */
  async logActivity(data) {
    const { userId, action, entity_type, entity_id, details, ip_address } = data;

    const [result] = await pool.execute(`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [userId, action, entity_type, entity_id, JSON.stringify(details), ip_address]);

    return result.insertId;
  }
};

export default SettingsModel;
