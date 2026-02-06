import bcrypt from "bcrypt";
import { createUserModel, loginUserModel } from "../models/User.model.js";
import {
  created,
  badRequest,
  conflict,
  serverError,
  ok,
  unauthorized,
} from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import pool from "../configs/db.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    //  Basic validation
    if (!name || !email || !password) {
      return badRequest(res, "All fields are required");
    }

    //  Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const data = {
      name,
      email,
      password: hashedPassword,
      created_by: 1,
    };

    const result = await createUserModel(data);

    if (!result || result.affectedRows === 0) {
      return badRequest(res, "User not created");
    }

    //  Success response (201)
    return created(res, "User created successfully", {
      userId: result.insertId,
    });
  } catch (err) {
    console.error("Register Error:", err);

    //  Handle duplicate email error (MySQL error code)
    if (err.code === "ER_DUP_ENTRY") {
      return conflict(res, "Email already exists");
    }

    return serverError(res);
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return badRequest(res, "Email and password are required");
    }

    // 1️ Find user
    const rows = await loginUserModel(email);

    if (rows.length === 0) {
      return unauthorized(res, "User does not exist");
    }

    const user = rows[0];

    // 2️ Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return unauthorized(res, "Invalid password");
    }

    // 3️ Generate token
    const token = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // 4️ Success response
    return ok(res, "Login successful", { token });
  } catch (err) {
    console.error("Login Error:", err);
    return serverError(res);
  }
};

