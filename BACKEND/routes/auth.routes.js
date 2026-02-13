import express from "express";
import authController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/categoryvalidate.middleware.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);

router.post("/login", validate(loginSchema), authController.login);

export default router;
