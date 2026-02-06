import express from "express";
import { loginUser, registerUser } from "../controllers/NewUser.controller.js";

const userRoute = express.Router();

userRoute.post('/create-user',registerUser);
userRoute.post('/login-user',loginUser);

export default userRoute;