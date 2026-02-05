import express from "express";
import { registerUser } from "../controllers/NewUser.controller.js";

const userRoute = express.Router();

userRoute.post('/create-user',registerUser);

export default userRoute;