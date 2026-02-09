import express from "express";
import {
  deleteByUser,
  deleteUserByAdmin,
  getAllUsers,
  getProfileById,
  loginUser,
  registerUser,
  updatepassword,
  updateProfile,
  viewProfile,
} from "../controllers/User.controller.js";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";

const userRoute = express.Router();

userRoute.post("/create-user", registerUser);
userRoute.post("/login-user", loginUser);
userRoute.get("/view-profile", auth, viewProfile);
userRoute.put("/update", auth, updateProfile);
userRoute.delete("/delete", auth, deleteByUser);
userRoute.get("/view-users", auth, adminOnly, getAllUsers);
userRoute.get("/view-user/:id", auth, adminOnly, getProfileById);
userRoute.delete("/delete/:id", auth, adminOnly, deleteUserByAdmin);
userRoute.patch("/update-password", auth, updatepassword);

export default userRoute;
