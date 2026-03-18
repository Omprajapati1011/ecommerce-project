import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api/api";

export const fetchOrders = createAsyncThunk(
  "order/fetchOrders",
  async (params = {}) => {
    const searchParams = new URLSearchParams();
    const { page, limit, sortField, sortOrder } = params;

    if (page !== undefined) searchParams.set("page", page);
    if (limit !== undefined) searchParams.set("limit", limit);
    if (sortField) searchParams.set("sortField", sortField);
    if (sortOrder !== undefined) {
      searchParams.set("sortOrder", Number(sortOrder) === 1 ? "ASC" : "DESC");
    }

    const res = await api.get(
      `/order/user-allorder${searchParams.size ? `?${searchParams.toString()}` : ""}`,
    );
    return res.data;
  },
);
export const postOrders = createAsyncThunk(
  "order/makeOrder",
  async (payload = {}) => {
    const res = await api.post("order/make-order", payload);
    return res.data.data;
  },
);
export const OrderSummery = createAsyncThunk("order/summery", async () => {
  const res = await api.get("/order/order-summery");
  return res.data.data;
});
export const getAdminOrder = createAsyncThunk(
  "order/admiorder",
  async (params = {}) => {
    const searchParams = new URLSearchParams();
    const { page, limit, sortField, sortOrder, search, status } = params;

    if (page !== undefined) searchParams.set("page", page);
    if (limit !== undefined) searchParams.set("limit", limit);
    if (sortField) searchParams.set("sortField", sortField);
    if (sortOrder !== undefined) {
      searchParams.set("sortOrder", Number(sortOrder) === 1 ? "ASC" : "DESC");
    }
    if (search) searchParams.set("search", search);
    if (status) searchParams.set("status", status);

    const res = await api.get(
      `/order/allorder${searchParams.size ? `?${searchParams.toString()}` : ""}`,
    );
    return res.data;
  },
);
export const findOrderItems = createAsyncThunk(
  "order/orderDetail",
  async ({ id, page = 1, limit = 5 } = {}) => {
    const res = await api.get(
      `/order-item/${id}/items?page=${page}&limit=${limit}`,
    );
    return res.data;
  },
);
export const fetchUserAddress = createAsyncThunk(
  "order/fatchAdress",
  async () => {
    const res = await api.get(`/users/show-addresses`);

    return res.data.data;
  },
);
const initialState = {
  orders: [],
  userAddresses: [],
  orderItems: [],
  orderSummery: [],
  adminOrders: [],
  adminStats: null,
  pagination: {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 5,
  },
  adminPagination: {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 5,
  },
  itemPagination: {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 5,
  },
  loading: false,
  error: null,
};
const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    updateOrderStatusLocally: (state, action) => {
      const { orderId, status } = action.payload || {};
      if (!orderId || !status) return;

      const applyStatus = (order) =>
        String(order?.order_id) === String(orderId)
          ? { ...order, order_status: status }
          : order;

      state.orders = state.orders.map(applyStatus);
      state.adminOrders = state.adminOrders.map(applyStatus);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data;

        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getAdminOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAdminOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.adminOrders = action.payload.data || [];
        state.adminStats = action.payload.stats || null;
        state.adminPagination = action.payload.pagination || {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          itemsPerPage: 5,
        };
      })
      .addCase(getAdminOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(OrderSummery.pending, (state) => {
        state.loading = true;
      })
      .addCase(OrderSummery.fulfilled, (state, action) => {
        state.loading = false;
        state.orderSummery = action.payload;
      })
      .addCase(OrderSummery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchUserAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.userAddresses = action.payload;
      })
      .addCase(fetchUserAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(postOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(postOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.push(action.payload);
      })

      .addCase(postOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(findOrderItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(findOrderItems.fulfilled, (state, action) => {
        state.loading = false;
        state.orderItems = action.payload.data;
        state.itemPagination = action.payload.pagination;
      })
      .addCase(findOrderItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { updateOrderStatusLocally } = orderSlice.actions;
export default orderSlice.reducer;
