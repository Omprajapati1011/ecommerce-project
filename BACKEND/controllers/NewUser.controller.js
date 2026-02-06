import pool from "../configs/db.js";
import bcrypt from "bcrypt";
import { registerUserModel } from "../models/User.model.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1️ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    let data = {
      name,
      email,
      password: hashedPassword,
      created_by: 1,
    };

    // 2️ Insert into database
    const result = await registerUserModel(data);

    console.log(result);

    // 3️ Check if inserted
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "User not created",
      });
    }

    // 4️ Success response
    return res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};
