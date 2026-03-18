import express from "express";
import {
  changeEmailRequestOtp,
  changeEmailVerifyOtp,
  deleteAccountRequestOtp,
  deleteAccountVerifyOtp,
  deleteByUser,
  deleteUserByAdmin,
  forgotPasswordRequestOtp,
  forgotPasswordResetWithToken,
  forgotPasswordVerifyOtp,
  getAllUsers,
  getProfileById,
  loginUser,
  registerRequestOtp,
  registerVerifyOtp,
  changePassword,
  updateProfile,
  viewProfile,
  blockUser,
  logoutUser,
  refreshToken,
  unblockUser,
  createUserByAdmin,
} from "../controllers/User.controller.js";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/Validations.middleware.js";
import {
  addressIdParamSchema,
  addressSchema,
  deleteAccountOtpRequestSchema,
  deleteAccountOtpVerifySchema,
  emailChangeOtpRequestSchema,
  emailChangeOtpVerifySchema,
  forgotPasswordOtpRequestSchema,
  forgotPasswordOtpVerifySchema,
  updateAddressSchema,
  updateProfileSchema,
  updatePasswordSchema,
  loginSchema,
  idParamSchema,
  registerOtpRequestSchema,
  registerOtpVerifySchema,
  resetPasswordWithTokenSchema,
  adminCreateUserSchema,
} from "../validations/user.validation.js";
import {
  addUserAddress,
  deleteAddress,
  getAddressById,
  getDefaultAddress,
  setDefaultAddress,
  showAllUserAddresses,
  updateAddress,
} from "../controllers/User.address.controller.js";

const userRoute = express.Router();

// ================= USER ROUTES =================

// Legacy direct register endpoint removed to enforce OTP-only signup.

// OTP-based register
userRoute.post(
  "/register/request-otp",
  validate(registerOtpRequestSchema),
  registerRequestOtp,
);
userRoute.post(
  "/register/verify-otp",
  validate(registerOtpVerifySchema),
  registerVerifyOtp,
);

// Login
userRoute.post("/login-user", validate(loginSchema), loginUser);

// OTP-based forgot password
userRoute.post(
  "/forgot-password/request-otp",
  validate(forgotPasswordOtpRequestSchema),
  forgotPasswordRequestOtp,
);
userRoute.post(
  "/forgot-password/verify-otp",
  validate(forgotPasswordOtpVerifySchema),
  forgotPasswordVerifyOtp,
);
userRoute.post(
  "/forgot-password/reset",
  validate(resetPasswordWithTokenSchema),
  forgotPasswordResetWithToken,
);

//Logout
userRoute.post("/logout", auth, logoutUser);

//getRefreshtoken
userRoute.post("/refresh-token", refreshToken);

// View own profile
userRoute.get("/view-profile", auth, viewProfile);

// Update profile
userRoute.put("/update", auth, validate(updateProfileSchema), updateProfile);

// Delete own account
userRoute.delete("/delete", auth, deleteByUser);

// Update password
userRoute.patch(
  "/update-password",
  auth,
  validate(updatePasswordSchema),
  changePassword,
);

// Change email with OTP verification
userRoute.post(
  "/change-email/request-otp",
  auth,
  validate(emailChangeOtpRequestSchema),
  changeEmailRequestOtp,
);
userRoute.post(
  "/changeEmail/request-otp",
  auth,
  validate(emailChangeOtpRequestSchema),
  changeEmailRequestOtp,
);
userRoute.post(
  "/change-email/verify-otp",
  auth,
  validate(emailChangeOtpVerifySchema),
  changeEmailVerifyOtp,
);
userRoute.post(
  "/changeEmail/verify-otp",
  auth,
  validate(emailChangeOtpVerifySchema),
  changeEmailVerifyOtp,
);

// Delete account with OTP verification
userRoute.post(
  "/delete-account/request-otp",
  auth,
  validate(deleteAccountOtpRequestSchema),
  deleteAccountRequestOtp,
);
userRoute.post(
  "/deleteAccount/request-otp",
  auth,
  validate(deleteAccountOtpRequestSchema),
  deleteAccountRequestOtp,
);
userRoute.post(
  "/delete-account/verify-otp",
  auth,
  validate(deleteAccountOtpVerifySchema),
  deleteAccountVerifyOtp,
);
userRoute.post(
  "/deleteAccount/verify-otp",
  auth,
  validate(deleteAccountOtpVerifySchema),
  deleteAccountVerifyOtp,
);

// ================= USER ADDRESS ROUTES =================

//add user address
userRoute.post("/add-address", auth, validate(addressSchema), addUserAddress);
userRoute.post("/addAddress", auth, validate(addressSchema), addUserAddress);

//set address default
userRoute.patch(
  "/setDefault/:id",
  auth,
  validate(idParamSchema, "params"),
  setDefaultAddress,
);
userRoute.post(
  "/setDefault/:id",
  auth,
  validate(idParamSchema, "params"),
  setDefaultAddress,
);
userRoute.patch(
  "/setDefaultAddress/:id",
  auth,
  validate(idParamSchema, "params"),
  setDefaultAddress,
);
userRoute.post(
  "/setDefaultAddress/:id",
  auth,
  validate(idParamSchema, "params"),
  setDefaultAddress,
);

//get default address
userRoute.get("/getDefault", auth, getDefaultAddress);
userRoute.get("/getDefaultAddress", auth, getDefaultAddress);
userRoute.get("/get-default-address", auth, getDefaultAddress);

//get all user addresses
userRoute.get("/show-addresses", auth, showAllUserAddresses);
userRoute.get("/getAllAddresses", auth, showAllUserAddresses);

//get address by id
userRoute.get(
  "/address/:id",
  auth,
  validate(idParamSchema, "params"),
  getAddressById,
);
userRoute.get(
  "/getAddressById/:id",
  auth,
  validate(idParamSchema, "params"),
  getAddressById,
);

//delete user address
userRoute.delete(
  "/delete-address/:addressId",
  auth,
  validate(addressIdParamSchema, "params"),
  deleteAddress,
);
userRoute.delete(
  "/deleteAddressById/:addressId",
  auth,
  validate(addressIdParamSchema, "params"),
  deleteAddress,
);

//update user address
userRoute.patch(
  "/update-address/:addressId",
  auth,
  validate(addressIdParamSchema, "params"),
  validate(updateAddressSchema),
  updateAddress,
);
userRoute.patch(
  "/updateAddress/:addressId",
  auth,
  validate(addressIdParamSchema, "params"),
  validate(updateAddressSchema),
  updateAddress,
);

// ================= ADMIN ROUTES =================

// Get all users
userRoute.get("/view-users", auth, adminOnly, getAllUsers);

// Admin create user
userRoute.post(
  "/admin/create",
  auth,
  adminOnly,
  validate(adminCreateUserSchema),
  createUserByAdmin,
);

// Get single user by ID
userRoute.get(
  "/view-user/:id",
  auth,
  adminOnly,
  validate(idParamSchema, "params"),
  getProfileById,
);

// Delete user by admin
userRoute.delete(
  "/delete/:id",
  auth,
  adminOnly,
  validate(idParamSchema, "params"),
  deleteUserByAdmin,
);

//blockByadmin
userRoute.patch(
  "/block/:id",
  auth,
  adminOnly,
  validate(idParamSchema, "params"),
  blockUser,
);

userRoute.patch(
  "/unblock/:id",
  auth,
  adminOnly,
  validate(idParamSchema, "params"),
  unblockUser,
);

export default userRoute;
