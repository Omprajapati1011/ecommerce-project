import bcrypt from "bcrypt";
import {
  createUserModel,
  deleteByUserModel,
  deleteUserByAdminModel,
  getAllUserModel,
  getUserById,
  loginUserModel,
  updateProfileModel,
  viewUserModel,
  updateUserPassword,
  getUserByIdforpassword,
} from "../models/user.model.js";
import {
  created,
  badRequest,
  conflict,
  serverError,
  ok,
  unauthorized,
  notFound,
} from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import pool from "../configs/db.js";
// import pool from "../configs/db.js";

//user
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

    await pool.query(
      `UPDATE user_master SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [user.user_id],
    );
     
    // 4️ Success response
    return ok(res, "Login successful", { token });
  } catch (err) {
    console.error("Login Error:", err);
    return serverError(res);
  }
};

export const viewProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return unauthorized(res, "Authentication required");
    }

    const userId = req.user.id;

    const [result] = await viewUserModel(userId);

    if (!result || result.length === 0) {
      return notFound(res, "User not found");
    }

    return ok(res, "Profile fetched successfully", result);
  } catch (error) {
    console.error("View Profile Error:", error);
    return serverError(res, "Failed to fetch profile");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    // console.log(userId);

    if (!userId) {
      return badRequest(res, "Invalid user");
    }

    // destructuring
    const { name, email } = req.body || {};

    // At least one field must be provided
    if (!name && !email) {
      return badRequest(res, "At least one field is required to update");
    }

    // Build update payload dynamically
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Extra safety check
    if (Object.keys(updateData).length === 0) {
      return badRequest(res, "Nothing to update");
    }

    const result = await updateProfileModel(updateData, userId);

    if (result.affectedRows === 0) {
      return notFound(res, "User not found or already deleted");
    }

    return ok(res, "User updated successfully");
  } catch (error) {
    console.error("Update profile error:", error);
    return serverError(res, "Failed to update profile");
  }
};

export const deleteByUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return unauthorized(res, "Unauthorized access");
    }

    const result = await deleteByUserModel(userId);

    if (result.affectedRows === 0) {
      return notFound(res, "User not found or already deleted");
    }

    return ok(res, "Account deleted successfully");
  } catch (error) {
    console.error("Delete account error:", error);
    return serverError(res, "Failed to delete account");
  }
};

export const changePassword = async (req, res) => {
  try {
    const id = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // 1️ Validate inputs
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // 2️ Get user password from DB
    const user = await getUserByIdforpassword(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 3️ Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect" });
    }

    // 4️ Check if new password is same as old
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be same as old password",
      });
    }

    // 5️ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 6️ Update password in DB
    const affectedRows = await updateUserPassword(id, hashedPassword);
    if (affectedRows === 0) {
      return res
        .status(500)
        .json({ success: false, message: "Password not updated" });
    }

    res.json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUserModel();

    if (!users || users.length === 0) {
      return notFound(res, "No users found");
    }

    return ok(res, "Users fetched successfully", users);
  } catch (err) {
    console.error("Get All Users Error:", err);
    return serverError(res, "Failed to fetch users");
  }
};

export const getProfileById = async (req, res) => {
  try {
    //get id from parameter
    const id = req.params.id;

    if (!id) {
      return badRequest(res, "User ID is required");
    }

    const result = await getUserById(id);

    if (result.length === 0) {
      return notFound(res, "User not found");
    }

    return ok(res, "User profile fetched successfully", result[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return serverError(res, "Failed to fetch user profile");
  }
};

export const deleteUserByAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    const result = await deleteUserByAdminModel(userId, adminId);

    if (result.affectedRows === 0) {
      return notFound(res, "User not found or already deleted");
    }

    return ok(res, "User deleted successfully");
  } catch (error) {
    console.error("Delete user error:", error);
    return serverError(res, "Failed to delete user");
  }
};
