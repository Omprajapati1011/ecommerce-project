import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as User from "../models/user.model.js";

// ===============================
// ✅ REGISTER USER
// ===============================
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const [existing] = await User.findByEmail(email);
    if (existing.length > 0) {
      return res.status(400).json({
        message: "User already exists, try with a different email ✉️",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.createUser({
      name,
      email,
      password: hashedPassword,
      role: "customer",
      created_by: null, // self registration
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===============================
// ✅ LOGIN USER
// ===============================
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.trim();
    password = password.trim();

    const [users] = await User.findByEmail(email);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const authController = { register, login };
export default authController;
