import express from "express";
import {
  deleteByUser,
  deleteUserByAdmin,
  getAllUsers,
  getProfileById,
  loginUser,
  registerUser,
  changePassword,
  updateProfile,
  viewProfile,
} from "../controllers/User.controller.js";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/Validations.middleware.js";
import {
  addressSchema,
  updateAddressSchema,
  updateProfileSchema,
} from "../validations/user.validation.js";
import { updatePasswordSchema } from "../validations/user.validation.js";
import { registerSchema } from "../validations/user.validation.js";
import { loginSchema } from "../validations/user.validation.js";
import { idParamSchema } from "../validations/user.validation.js";
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

// Register
userRoute.post("/create-user", validate(registerSchema), registerUser);

// Login
userRoute.post("/login-user", validate(loginSchema), loginUser);

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

// ================= USER ADDRESS ROUTES =================

//add user address
userRoute.post("/add-address", auth, validate(addressSchema), addUserAddress);

//set address default
userRoute.patch(
  "/setDefault/:id",
  auth,
  validate(idParamSchema, "params"),
  setDefaultAddress,
);

//get default address
userRoute.get("/getDefault", auth, getDefaultAddress);

//get all user addresses
userRoute.get("/show-addresses", auth, showAllUserAddresses);

//get address by id
userRoute.get(
  "/address/:id",
  auth,
  validate(idParamSchema, "params"),
  getAddressById,
);

//delete user address
userRoute.delete(
  "/delete-address/:addressId",
  auth,
  validate(idParamSchema, "params"),
  deleteAddress,
);

//update user address
userRoute.patch(
  "/update-address/:addressId",
  auth,
  validate(idParamSchema, "params"),
  validate(updateAddressSchema),
  updateAddress,
);

// ================= ADMIN ROUTES =================

// Get all users
userRoute.get("/view-users", auth, adminOnly, getAllUsers);

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

export default userRoute;
