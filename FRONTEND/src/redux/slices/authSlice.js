// src/redux/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api/api";
import getApiErrorMessage from "../../utils/apiError";

//  Get user from localStorage
const storedUser = localStorage.getItem("currentUser");
const storedToken = localStorage.getItem("token");
const storedRefreshToken = localStorage.getItem("refreshToken");

//  LOGIN
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/users/login-user", {
        email,
        password,
      });

      const payload = response.data?.data || {};
      const { token, refreshToken } = payload;
      const rawUser = payload.user || response.data?.user || {};

      const mappedUser = {
        user_id: rawUser.user_id ?? rawUser.id ?? null,
        email: rawUser.email ?? email,
        role:
          rawUser.role ?? rawUser.role_name ?? rawUser.roleName ?? "customer",
      };

      if (token) localStorage.setItem("token", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("currentUser", JSON.stringify(mappedUser));

      return {
        user: mappedUser,
        token: token || null,
        refreshToken: refreshToken || null,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "We could not log you in right now. Please try again.",
        ),
      );
    }
  },
);

//  REGISTER
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (_, { rejectWithValue }) => {
    return rejectWithValue(
      "Direct registration is disabled. Use OTP registration flow.",
    );
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post("/users/logout");
      dispatch(clearAuth());
      return response.data;
    } catch (error) {
      dispatch(clearAuth());
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "We signed you out locally, but the server could not confirm it.",
        ),
      );
    }
  },
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { rejectWithValue }) => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (!storedRefreshToken) {
        return rejectWithValue("No refresh token available");
      }

      const response = await api.post("/users/refresh-token", {
        refreshToken: storedRefreshToken,
      });

      const newAccessToken = response.data?.data?.accessToken;

      if (!newAccessToken) {
        return rejectWithValue("Refresh endpoint did not return access token");
      }

      localStorage.setItem("token", newAccessToken);

      return newAccessToken;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Your session could not be refreshed. Please log in again.",
        ),
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    currentUser: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    refreshToken: storedRefreshToken || null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAuth: (state) => {
      state.currentUser = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null; //  clear error also
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
    },

    clearError: (state) => {
      state.error = null; // only clears error
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(refreshAccessToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
        state.error = null;
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentUser = null;
        state.token = null;
        state.refreshToken = null;
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
      });
  },
});

export const { clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
