import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api/api";
import getApiErrorMessage from "../../utils/apiError";

// ===============================
// FETCH ALL USERS
// ===============================
export const fetchAllUsers = createAsyncThunk(
  "users/fetchAllUsers",
  async (
    {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      status = "",
      sortField = "",
      sortOrder = "desc",
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (role) params.role = role;
      if (status) params.status = status;
      if (sortField) params.sortField = sortField;
      if (sortOrder) params.sortOrder = sortOrder;

      const response = await api.get("/users/view-users", {
        params,
      });

      return {
        users: response.data?.data || [],
        pagination: response.data?.pagination || null,
      };

    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "We could not load the users right now."),
      );
    }
  }
);

export const fetchUserProfileById = createAsyncThunk(
  "users/fetchUserProfileById",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/view-user/${userId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "We could not load this user profile."),
      );
    }
  },
);

export const blockUserByAdmin = createAsyncThunk(
  "users/blockUserByAdmin",
  async (userId, { rejectWithValue }) => {
    try {
      await api.patch(`/users/block/${userId}`);
      return userId;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "We could not update this user right now."),
      );
    }
  },
);

export const unblockUserByAdmin = createAsyncThunk(
  "users/unblockUserByAdmin",
  async (userId, { rejectWithValue }) => {
    try {
      await api.patch(`/users/unblock/${userId}`);
      return userId;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "We could not update this user right now."),
      );
    }
  },
);

export const deleteUserByAdmin = createAsyncThunk(
  "users/deleteUserByAdmin",
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(`/users/delete/${userId}`);
      return userId;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "We could not delete this user right now."),
      );
    }
  },
);

export const createUserByAdmin = createAsyncThunk(
  "users/createUserByAdmin",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/users/admin/create", payload);
      return response.data?.data || null;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "We could not create the user right now."),
      );
    }
  },
);

const userSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    pagination: {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
    selectedProfile: null,
    loading: false,
    profileLoading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination =
          action.payload.pagination || state.pagination;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserProfileById.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfileById.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.selectedProfile = action.payload;
      })
      .addCase(fetchUserProfileById.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      })
      .addCase(blockUserByAdmin.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(blockUserByAdmin.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.users = state.users.map((user) =>
          user.user_id === action.payload ? { ...user, is_blocked: 1 } : user,
        );
      })
      .addCase(blockUserByAdmin.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(unblockUserByAdmin.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(unblockUserByAdmin.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.users = state.users.map((user) =>
          user.user_id === action.payload ? { ...user, is_blocked: 0 } : user,
        );
      })
      .addCase(unblockUserByAdmin.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteUserByAdmin.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteUserByAdmin.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.users = state.users.filter((user) => user.user_id !== action.payload);
        if (state.selectedProfile?.user_id === action.payload) {
          state.selectedProfile = null;
        }
      })
      .addCase(deleteUserByAdmin.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(createUserByAdmin.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createUserByAdmin.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createUserByAdmin.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
