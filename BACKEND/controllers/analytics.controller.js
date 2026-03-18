/**
 * @module AnalyticsController
 * @description Handles admin analytics and reporting endpoints.
 * Provides aggregated data for dashboard visualization.
 */
import AnalyticsModel from "../models/analytics.model.js";
import { ok, serverError } from "../utils/apiResponse.js";

/**
 * Get overview statistics
 * GET /api/analytics/overview
 */
export const getOverviewStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = await AnalyticsModel.getOverviewStats(days);
    return ok(res, "Overview statistics fetched successfully", stats);
  } catch (err) {
    console.error("Error fetching overview stats:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get revenue chart data
 * GET /api/analytics/revenue?days=30
 */
export const getRevenueChart = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsModel.getRevenueChart(days);
    return ok(res, "Revenue chart data fetched successfully", data);
  } catch (err) {
    console.error("Error fetching revenue chart:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get order status distribution
 * GET /api/analytics/orders/status
 */
export const getOrderStatusDistribution = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsModel.getOrderStatusDistribution(days);
    return ok(res, "Order status distribution fetched successfully", data);
  } catch (err) {
    console.error("Error fetching order status distribution:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get top selling products
 * GET /api/analytics/products/top?limit=10
 */
export const getTopSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsModel.getTopSellingProducts(limit, days);
    return ok(res, "Top selling products fetched successfully", data);
  } catch (err) {
    console.error("Error fetching top selling products:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get category sales distribution
 * GET /api/analytics/categories/sales
 */
export const getCategorySales = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsModel.getCategorySales(days);
    return ok(res, "Category sales fetched successfully", data);
  } catch (err) {
    console.error("Error fetching category sales:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get payment method distribution
 * GET /api/analytics/payments/methods
 */
export const getPaymentMethodDistribution = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsModel.getPaymentMethodDistribution(days);
    return ok(res, "Payment method distribution fetched successfully", data);
  } catch (err) {
    console.error("Error fetching payment method distribution:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get recent orders
 * GET /api/analytics/orders/recent?limit=10
 */
export const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsModel.getRecentOrders(limit, days);
    return ok(res, "Recent orders fetched successfully", data);
  } catch (err) {
    console.error("Error fetching recent orders:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get user registration trend
 * GET /api/analytics/users/trend?days=30
 */
export const getUserRegistrationTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsModel.getUserRegistrationTrend(days);
    return ok(res, "User registration trend fetched successfully", data);
  } catch (err) {
    console.error("Error fetching user registration trend:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get offer usage statistics
 * GET /api/analytics/offers/usage
 */
export const getOfferUsageStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsModel.getOfferUsageStats(days);
    return ok(res, "Offer usage statistics fetched successfully", data);
  } catch (err) {
    console.error("Error fetching offer usage stats:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get low stock products
 * GET /api/analytics/products/low-stock?threshold=10
 */
export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const data = await AnalyticsModel.getLowStockProducts(threshold);
    return ok(res, "Low stock products fetched successfully", data);
  } catch (err) {
    console.error("Error fetching low stock products:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get monthly revenue comparison
 * GET /api/analytics/revenue/monthly-comparison
 */
export const getMonthlyRevenueComparison = async (req, res) => {
  try {
    const data = await AnalyticsModel.getMonthlyRevenueComparison();
    return ok(res, "Monthly revenue comparison fetched successfully", data);
  } catch (err) {
    console.error("Error fetching monthly revenue comparison:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get AOV trend
 * GET /api/analytics/aov/trend?days=30
 */
export const getAOVTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsModel.getAOVTrend(days);
    return ok(res, "AOV trend fetched successfully", data);
  } catch (err) {
    console.error("Error fetching AOV trend:", err);
    return serverError(res, err.message);
  }
};

/**
 * Get all dashboard data in one call
 * GET /api/analytics/dashboard
 */
export const getDashboardData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const [
      overview,
      revenueChart,
      orderStatus,
      topProducts,
      categorySales,
      paymentMethods,
      recentOrders,
      userTrend,
      offerUsage,
      lowStock,
      monthlyComparison,
      aovTrend
    ] = await Promise.all([
      AnalyticsModel.getOverviewStats(days),
      AnalyticsModel.getRevenueChart(days),
      AnalyticsModel.getOrderStatusDistribution(days),
      AnalyticsModel.getTopSellingProducts(5, days),
      AnalyticsModel.getCategorySales(days),
      AnalyticsModel.getPaymentMethodDistribution(days),
      AnalyticsModel.getRecentOrders(5, days),
      AnalyticsModel.getUserRegistrationTrend(days),
      AnalyticsModel.getOfferUsageStats(days),
      AnalyticsModel.getLowStockProducts(10),
      AnalyticsModel.getMonthlyRevenueComparison(),
      AnalyticsModel.getAOVTrend(days)
    ]);

    return ok(res, "Dashboard data fetched successfully", {
      overview,
      charts: {
        revenue: revenueChart,
        orderStatus,
        categorySales,
        paymentMethods,
        userTrend,
        monthlyComparison,
        aovTrend
      },
      topProducts,
      recentOrders,
      offerUsage,
      lowStock
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    return serverError(res, err.message);
  }
};
