/**
 * @module SettingsRoutes
 * @description Application settings management routes.
 * All routes require authentication and admin role.
 */
import express from "express";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";
import {
  getAllSettings,
  getSettingsByCategory,
  getSettingByKey,
  updateSetting,
  updateSettingsBulk,
  createSetting,
  deleteSetting,
  getSystemInfo,
  getActivityLogs,
  getDatabaseStats,
} from "../controllers/settings.controller.js";

const router = express.Router();

// All settings routes require auth + admin role
router.use(auth, adminOnly);

// Settings CRUD
router.get("/", getAllSettings);
router.get("/category/:category", getSettingsByCategory);
router.get("/key/:key", getSettingByKey);
router.put("/:key", updateSetting);
router.put("/bulk/update", updateSettingsBulk);
router.post("/", createSetting);
router.delete("/:key", deleteSetting);

// System information
router.get("/system/info", getSystemInfo);
router.get("/database/stats", getDatabaseStats);
router.get("/activity-logs", getActivityLogs);

export default router;
