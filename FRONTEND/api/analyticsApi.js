/**
 * @module analyticsApi
 * @description API layer for admin analytics and reporting.
 *
 * Endpoints used:
 *  - GET /api/analytics/dashboard   → fetchDashboardData (all-in-one)
 *  - GET /api/analytics/overview    → fetchOverviewStats
 *  - GET /api/analytics/revenue     → fetchRevenueChart
 *  - GET /api/analytics/orders/status → fetchOrderStatusDistribution
 *  - GET /api/analytics/products/top → fetchTopSellingProducts
 *  - GET /api/analytics/categories/sales → fetchCategorySales
 *  - GET /api/analytics/payments/methods → fetchPaymentMethodDistribution
 *  - GET /api/analytics/orders/recent → fetchRecentOrders
 *  - GET /api/analytics/users/trend → fetchUserRegistrationTrend
 *  - GET /api/analytics/offers/usage → fetchOfferUsageStats
 *  - GET /api/analytics/products/low-stock → fetchLowStockProducts
 *  - GET /api/analytics/revenue/monthly-comparison → fetchMonthlyRevenueComparison
 *  - GET /api/analytics/aov/trend → fetchAOVTrend
 */
import api from "./api";

/**
 * Fetch all dashboard data in one call
 * @returns {Promise<Object>}
 */
export const fetchDashboardData = async (days = 30) => {
  const response = await api.get(`/analytics/dashboard?days=${days}`);
  return response.data?.data || {};
};

/**
 * Fetch overview statistics
 * @returns {Promise<Object>}
 */
export const fetchOverviewStats = async () => {
  const response = await api.get("/analytics/overview");
  return response.data?.data || {};
};

/**
 * Fetch revenue chart data
 * @param {number} days - Number of days
 * @returns {Promise<Array>}
 */
export const fetchRevenueChart = async (days = 30) => {
  const response = await api.get(`/analytics/revenue?days=${days}`);
  return response.data?.data || [];
};

/**
 * Fetch order status distribution
 * @returns {Promise<Array>}
 */
export const fetchOrderStatusDistribution = async () => {
  const response = await api.get("/analytics/orders/status");
  return response.data?.data || [];
};

/**
 * Fetch top selling products
 * @param {number} limit - Number of products
 * @returns {Promise<Array>}
 */
export const fetchTopSellingProducts = async (limit = 10) => {
  const response = await api.get(`/analytics/products/top?limit=${limit}`);
  return response.data?.data || [];
};

/**
 * Fetch category sales distribution
 * @returns {Promise<Array>}
 */
export const fetchCategorySales = async () => {
  const response = await api.get("/analytics/categories/sales");
  return response.data?.data || [];
};

/**
 * Fetch payment method distribution
 * @returns {Promise<Array>}
 */
export const fetchPaymentMethodDistribution = async () => {
  const response = await api.get("/analytics/payments/methods");
  return response.data?.data || [];
};

/**
 * Fetch recent orders
 * @param {number} limit - Number of orders
 * @returns {Promise<Array>}
 */
export const fetchRecentOrders = async (limit = 10) => {
  const response = await api.get(`/analytics/orders/recent?limit=${limit}`);
  return response.data?.data || [];
};

/**
 * Fetch user registration trend
 * @param {number} days - Number of days
 * @returns {Promise<Array>}
 */
export const fetchUserRegistrationTrend = async (days = 30) => {
  const response = await api.get(`/analytics/users/trend?days=${days}`);
  return response.data?.data || [];
};

/**
 * Fetch offer usage statistics
 * @returns {Promise<Array>}
 */
export const fetchOfferUsageStats = async () => {
  const response = await api.get("/analytics/offers/usage");
  return response.data?.data || [];
};

/**
 * Fetch low stock products
 * @param {number} threshold - Stock threshold
 * @returns {Promise<Array>}
 */
export const fetchLowStockProducts = async (threshold = 10) => {
  const response = await api.get(`/analytics/products/low-stock?threshold=${threshold}`);
  return response.data?.data || [];
};

/**
 * Fetch monthly revenue comparison
 * @returns {Promise<Array>}
 */
export const fetchMonthlyRevenueComparison = async () => {
  const response = await api.get("/analytics/revenue/monthly-comparison");
  return response.data?.data || [];
};

/**
 * Fetch AOV trend
 * @param {number} days - Number of days
 * @returns {Promise<Array>}
 */
export const fetchAOVTrend = async (days = 30) => {
  const response = await api.get(`/analytics/aov/trend?days=${days}`);
  return response.data?.data || [];
};
