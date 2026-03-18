/**
 * @module AnalyticsRoutes
 * @description Admin analytics and reporting API routes.
 * All routes require authentication and admin role.
 */
import express from "express";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";
import {
  getOverviewStats,
  getRevenueChart,
  getOrderStatusDistribution,
  getTopSellingProducts,
  getCategorySales,
  getPaymentMethodDistribution,
  getRecentOrders,
  getUserRegistrationTrend,
  getOfferUsageStats,
  getLowStockProducts,
  getMonthlyRevenueComparison,
  getAOVTrend,
  getDashboardData
} from "../controllers/analytics.controller.js";

const router = express.Router();

// All analytics routes require auth + admin role
router.use(auth, adminOnly);

// Dashboard data (all-in-one endpoint)
router.get("/dashboard", getDashboardData);

// Individual endpoints for specific data
router.get("/overview", getOverviewStats);
router.get("/revenue", getRevenueChart);
router.get("/revenue/monthly-comparison", getMonthlyRevenueComparison);
router.get("/orders/status", getOrderStatusDistribution);
router.get("/orders/recent", getRecentOrders);
router.get("/products/top", getTopSellingProducts);
router.get("/products/low-stock", getLowStockProducts);
router.get("/categories/sales", getCategorySales);
router.get("/payments/methods", getPaymentMethodDistribution);
router.get("/users/trend", getUserRegistrationTrend);
router.get("/offers/usage", getOfferUsageStats);
router.get("/aov/trend", getAOVTrend);

export default router;
