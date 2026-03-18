/**
 * @module SettingsController
 * @description Handles application settings management.
 */
import SettingsModel from "../models/settings.model.js";
import { ok, badRequest, serverError, notFound } from "../utils/apiResponse.js";

/**
 * Get all settings grouped by category
 * GET /api/settings
 */
export const getAllSettings = async (req, res) => {
  try {
    const settings = await SettingsModel.getAllSettings();
    return ok(res, "Settings fetched successfully", settings);
  } catch (err) {
    console.error("Error fetching settings:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get settings by category
 * GET /api/settings/:category
 */
export const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await SettingsModel.getSettingsByCategory(category);
    
    if (Object.keys(settings).length === 0) {
      return notFound(res, "Settings category not found");
    }
    
    return ok(res, "Settings fetched successfully", settings);
  } catch (err) {
    console.error("Error fetching settings:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get a single setting
 * GET /api/settings/key/:key
 */
export const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const value = await SettingsModel.getSetting(key);
    
    if (value === null) {
      return notFound(res, "Setting not found");
    }
    
    return ok(res, "Setting fetched successfully", { key, value });
  } catch (err) {
    console.error("Error fetching setting:", err);
    return serverError(res, err.message);
  }
};

/**
 * Update a single setting
 * PUT /api/settings/:key
 */
export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user?.id;

    if (value === undefined) {
      return badRequest(res, "Value is required");
    }

    const updated = await SettingsModel.updateSetting(key, String(value), userId);
    
    if (!updated) {
      return notFound(res, "Setting not found");
    }

    // Log activity
    await SettingsModel.logActivity({
      userId,
      action: "UPDATE_SETTING",
      entity_type: "setting",
      entity_id: key,
      details: { key, newValue: value },
      ip_address: req.ip,
    });

    return ok(res, "Setting updated successfully", { key, value });
  } catch (err) {
    console.error("Error updating setting:", err);
    return serverError(res, err.message);
  }
};

/**
 * Update multiple settings
 * PUT /api/settings/bulk/update
 */
export const updateSettingsBulk = async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user?.id;

    if (!settings || typeof settings !== "object") {
      return badRequest(res, "Settings object is required");
    }

    const updated = await SettingsModel.updateSettings(settings, userId);

    // Log activity
    await SettingsModel.logActivity({
      userId,
      action: "BULK_UPDATE_SETTINGS",
      entity_type: "settings",
      entity_id: null,
      details: { count: updated, keys: Object.keys(settings) },
      ip_address: req.ip,
    });

    return ok(res, `${updated} settings updated successfully`, { updated });
  } catch (err) {
    console.error("Error updating settings:", err);
    return serverError(res, err.message);
  }
};

/**
 * Create a new setting
 * POST /api/settings
 */
export const createSetting = async (req, res) => {
  try {
    const { setting_key, setting_value, setting_type, category, description } = req.body;
    const userId = req.user?.id;

    if (!setting_key || setting_value === undefined) {
      return badRequest(res, "Setting key and value are required");
    }

    const insertId = await SettingsModel.createSetting({
      setting_key,
      setting_value: String(setting_value),
      setting_type,
      category: category || "general",
      description,
      userId,
    });

    // Log activity
    await SettingsModel.logActivity({
      userId,
      action: "CREATE_SETTING",
      entity_type: "setting",
      entity_id: setting_key,
      details: { key: setting_key, value: setting_value },
      ip_address: req.ip,
    });

    return ok(res, "Setting created successfully", { id: insertId, key: setting_key });
  } catch (err) {
    console.error("Error creating setting:", err);
    return serverError(res, err.message);
  }
};

/**
 * Delete a setting
 * DELETE /api/settings/:key
 */
export const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user?.id;

    const deleted = await SettingsModel.deleteSetting(key);
    
    if (!deleted) {
      return notFound(res, "Setting not found");
    }

    // Log activity
    await SettingsModel.logActivity({
      userId,
      action: "DELETE_SETTING",
      entity_type: "setting",
      entity_id: key,
      details: { key },
      ip_address: req.ip,
    });

    return ok(res, "Setting deleted successfully");
  } catch (err) {
    console.error("Error deleting setting:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get system information
 * GET /api/settings/system/info
 */
export const getSystemInfo = async (req, res) => {
  try {
    const info = await SettingsModel.getSystemInfo();
    return ok(res, "System info fetched successfully", info);
  } catch (err) {
    console.error("Error fetching system info:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get activity logs
 * GET /api/settings/activity-logs?limit=50
 */
export const getActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await SettingsModel.getActivityLogs(limit);
    return ok(res, "Activity logs fetched successfully", logs);
  } catch (err) {
    console.error("Error fetching activity logs:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get database statistics
 * GET /api/settings/database/stats
 */
export const getDatabaseStats = async (req, res) => {
  try {
    const [counts] = await SettingsModel.getSystemInfo();
    
    const stats = {
      tables: counts.tables,
      database: counts.database,
    };

    return ok(res, "Database stats fetched successfully", stats);
  } catch (err) {
    console.error("Error fetching database stats:", err);
    return serverError(res, err.message);
  }
};
