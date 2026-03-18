/**
 * API layer for admin order and payment management.
 */
import api from "./api";

export const fetchAdminOrders = async ({
  page = 1,
  limit = 10,
  search = "",
  sortField = "",
  sortOrder = 1,
  orderStatus = null,
  paymentStatus = null,
  paymentMethod = null,
  dateFrom = null,
  dateTo = null,
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);

  if (search) params.append("search", search);
  if (sortField) {
    params.append("sortField", sortField);
    params.append("sortOrder", sortOrder === 1 ? "ASC" : "DESC");
  }
  if (orderStatus) params.append("status", orderStatus);
  if (paymentStatus) params.append("payment_status", paymentStatus);
  if (paymentMethod) params.append("payment_method", paymentMethod);
  if (dateFrom) params.append("date_from", dateFrom);
  if (dateTo) params.append("date_to", dateTo);

  const response = await api.get(`/order/admin/orders?${params.toString()}`);
  const payload = response.data || {};

  return {
    data: payload.data || [],
    total: payload.pagination?.totalItems || 0,
    stats: payload.stats || {},
    pagination: payload.pagination || null,
  };
};

export const fetchAdminOrderDetail = async (orderId) => {
  const response = await api.get(`/order/admin/orders/${orderId}`);
  return response.data?.data || null;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/order/changestatus/${orderId}`, {
    latestStatus: status,
  });
  return response.data;
};

export const updatePaymentStatus = async (orderId, status) => {
  const response = await api.patch(
    `/order/admin/orders/${orderId}/payment-status`,
    { paymentStatus: status },
  );
  return response.data;
};

export const markCODComplete = async (paymentId) => {
  const response = await api.put(`/payments/${paymentId}/complete-cod`);
  return response.data;
};

export const refundPayment = async (paymentId, { amount, reason } = {}) => {
  const body = {};
  if (amount) body.amount = amount;
  if (reason) body.reason = reason;
  const response = await api.post(`/payments/${paymentId}/refund`, body);
  return response.data;
};

export const fetchCancelRequests = async ({ status = null, limit = 100 } = {}) => {
  const params = new URLSearchParams();
  params.append("limit", limit);
  if (status) params.append("status", status);

  const response = await api.get(`/order/admin/cancel-requests?${params.toString()}`);
  return response.data?.data || { pendingCount: 0, requests: [] };
};

export const reviewCancelRequest = async (
  requestId,
  { action, admin_note } = {},
) => {
  const response = await api.patch(`/order/admin/cancel-requests/${requestId}`, {
    action,
    admin_note,
  });
  return response.data?.data || null;
};
