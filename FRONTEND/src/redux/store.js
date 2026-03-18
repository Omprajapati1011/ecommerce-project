import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import userReducer from "./slices/userSlice.js";
import orderReducer from "./slices/orderSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    order: orderReducer,
  },
});
export default store;