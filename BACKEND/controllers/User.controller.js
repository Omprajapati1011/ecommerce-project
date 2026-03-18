import bcrypt from "bcrypt";
import {
  createUserModel,
  deleteByUserModel,
  deleteUserByAdminModel,
  getAllUserModel,
  getAllUserCountModel,
  getUserById,
  loginUserModel,
  updateProfileModel,
  viewUserModel,
  updateUserPassword,
  getUserByIdforpassword,
  blockUserById,
  logoutUserModel,
  refreshTokenHelper,
  unblockUserById,
} from "../models/user.model.js";
import {
  created,
  badRequest,
  conflict,
  serverError,
  ok,
  unauthorized,
  forbidden,
  notFound,
  paginated,
  tooManyRequests,
} from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import pool from "../configs/db.js";
import "../configs/env.js";
import crypto from "crypto";

const OTP_PURPOSE_REGISTER = "register";
const OTP_PURPOSE_FORGOT_PASSWORD = "forgot_password";
const OTP_PURPOSE_EMAIL_CHANGE = "email_change";
const OTP_PURPOSE_DELETE_ACCOUNT = "delete_account";
const RESET_PURPOSE_PASSWORD = "password_reset";

const OTP_TOKEN_SECRET = process.env.OTP_JWT_SECRET || process.env.JWT_SECRET;
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || OTP_TOKEN_SECRET;
const OTP_EXPIRES_IN = process.env.OTP_EXPIRES_IN || "10m";
const RESET_TOKEN_EXPIRES_IN = process.env.RESET_TOKEN_EXPIRES_IN || "15m";

const generateOtp = () => String(crypto.randomInt(100000, 1000000));
const generateTempPassword = () =>
  crypto.randomBytes(9).toString("base64url").slice(0, 12);

const hashOtp = (otp) => {
  const pepper = process.env.OTP_PEPPER || "";
  return crypto.createHash("sha256").update(`${otp}.${pepper}`).digest("hex");
};

const isHashMatch = (inputHashHex, expectedHashHex) => {
  if (!inputHashHex || !expectedHashHex) return false;
  if (inputHashHex.length !== expectedHashHex.length) return false;

  const inputBuffer = Buffer.from(inputHashHex, "hex");
  const expectedBuffer = Buffer.from(expectedHashHex, "hex");
  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
};

const getMailTransportConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: { user, pass },
  };
};

const sendOtpEmail = async ({ to, otp, purpose }) => {
  const transportConfig = getMailTransportConfig();
  if (!transportConfig) {
    throw new Error("SMTP is not configured");
  }

  const { default: nodemailer } = await import("nodemailer");
  const transporter = nodemailer.createTransport(transportConfig);

  const subject =
    purpose === OTP_PURPOSE_REGISTER
      ? "Your registration OTP"
      : purpose === OTP_PURPOSE_EMAIL_CHANGE
        ? "Your email change OTP"
        : purpose === OTP_PURPOSE_DELETE_ACCOUNT
          ? "Your account deletion OTP"
          : "Your password reset OTP";

  const mailFrom =
    process.env.SMTP_FROM ||
    `"${process.env.SMTP_FROM_NAME || "Ecommerce App"}" <${process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRES_IN}.`,
  });
};

const sendAdminCreatedEmail = async ({ to, name, tempPassword }) => {
  const transportConfig = getMailTransportConfig();
  if (!transportConfig) {
    throw new Error("SMTP is not configured");
  }

  const { default: nodemailer } = await import("nodemailer");
  const transporter = nodemailer.createTransport(transportConfig);

  const subject = "Your account has been created";
  const mailFrom =
    process.env.SMTP_FROM ||
    `"${process.env.SMTP_FROM_NAME || "Ecommerce App"}" <${process.env.SMTP_USER}>`;

  const displayName = name || "User";

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    text:
      `Hi ${displayName},\n\n` +
      "An admin has created an account for you.\n" +
      `Login email: ${to}\n` +
      `Temporary password: ${tempPassword}\n\n` +
      "After login, reset your password.\n",
  });
};

// In-memory OTP rate limiting (per process)
const otpRequestLimiter = new Map();
const otpVerifyLimiter = new Map();

const OTP_REQUEST_LIMIT = Number(process.env.OTP_REQUEST_LIMIT || 3);
const OTP_REQUEST_WINDOW_MS = Number(
  process.env.OTP_REQUEST_WINDOW_MS || 10 * 60 * 1000,
);
const OTP_REQUEST_MIN_INTERVAL_MS = Number(
  process.env.OTP_REQUEST_MIN_INTERVAL_MS || 60 * 1000,
);

const OTP_VERIFY_LIMIT = Number(process.env.OTP_VERIFY_LIMIT || 5);
const OTP_VERIFY_WINDOW_MS = Number(
  process.env.OTP_VERIFY_WINDOW_MS || 10 * 60 * 1000,
);

const getClientIp = (req) => {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim().length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.ip || "unknown";
};

const checkRateLimit = (store, key, max, windowMs, minIntervalMs = 0) => {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now, lastHit: now });
    return { allowed: true };
  }

  if (minIntervalMs && now - entry.lastHit < minIntervalMs) {
    const retryAfterMs = minIntervalMs - (now - entry.lastHit);
    return { allowed: false, retryAfterMs };
  }

  if (entry.count >= max) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count += 1;
  entry.lastHit = now;
  store.set(key, entry);
  return { allowed: true };
};

const formatRetrySeconds = (retryAfterMs) => {
  if (!retryAfterMs || retryAfterMs <= 0) return 1;
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
};

//user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.validated?.body || req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const data = {
      name,
      email,
      password: hashedPassword,
      created_by: 1,
    };

    const result = await createUserModel(data);

    return created(res, "User created successfully", {
      userId: result.insertId,
    });
  } catch (err) {
    console.error("Register Error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return conflict(res, "Email already exists");
    }

    return serverError(res);
  }
};
//request for otp
export const registerRequestOtp = async (req, res) => {
  try {
    if (!OTP_TOKEN_SECRET) {
      return serverError(
        res,
        "OTP_JWT_SECRET or JWT_SECRET is required for OTP flows",
      );
    }

    const { name, email, password } = req.validated?.body || req.body;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const clientIp = getClientIp(req);

    const requestKey = `register:${normalizedEmail}:${clientIp}`;
    const requestLimit = checkRateLimit(
      otpRequestLimiter,
      requestKey,
      OTP_REQUEST_LIMIT,
      OTP_REQUEST_WINDOW_MS,
      OTP_REQUEST_MIN_INTERVAL_MS,
    );
    if (!requestLimit.allowed) {
      const retrySeconds = formatRetrySeconds(requestLimit.retryAfterMs);
      return tooManyRequests(
        res,
        `Too many OTP requests. Please try again in ${retrySeconds} seconds.`,
      );
    }

    const existingUsers = await loginUserModel(normalizedEmail);
    if (existingUsers.length > 0) {
      return conflict(res, "Email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const otpToken = jwt.sign(
      {
        purpose: OTP_PURPOSE_REGISTER,
        name,
        email: normalizedEmail,
        passwordHash,
        otpHash,
      },
      OTP_TOKEN_SECRET,
      { expiresIn: OTP_EXPIRES_IN },
    );

    await sendOtpEmail({
      to: normalizedEmail,
      otp,
      purpose: OTP_PURPOSE_REGISTER,
    });

    const responseData = { otpToken, expiresIn: OTP_EXPIRES_IN };
    if (process.env.NODE_ENV !== "production") {
      responseData.devOtp = otp;
    }

    return ok(res, "OTP sent to your email", responseData);
  } catch (error) {
    console.error("registerRequestOtp Error:", error);
    return serverError(res, "Failed to send registration OTP");
  }
};
//verify otp
export const registerVerifyOtp = async (req, res) => {
  try {
    if (!OTP_TOKEN_SECRET) {
      return serverError(
        res,
        "OTP_JWT_SECRET or JWT_SECRET is required for OTP flows",
      );
    }

    const { otp, otpToken } = req.validated?.body || req.body;
    const clientIp = getClientIp(req);

    const verifyKey = `register-verify:${otpToken}:${clientIp}`;
    const verifyLimit = checkRateLimit(
      otpVerifyLimiter,
      verifyKey,
      OTP_VERIFY_LIMIT,
      OTP_VERIFY_WINDOW_MS,
    );
    if (!verifyLimit.allowed) {
      const retrySeconds = formatRetrySeconds(verifyLimit.retryAfterMs);
      return tooManyRequests(
        res,
        `Too many OTP attempts. Please try again in ${retrySeconds} seconds.`,
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(otpToken, OTP_TOKEN_SECRET);
    } catch (error) {
      return badRequest(res, "Invalid or expired OTP token");
    }

    if (decoded.purpose !== OTP_PURPOSE_REGISTER) {
      return badRequest(res, "Invalid OTP purpose");
    }

    const inputOtpHash = hashOtp(otp);
    if (!isHashMatch(inputOtpHash, decoded.otpHash)) {
      return badRequest(res, "Invalid OTP");
    }

    const existingUsers = await loginUserModel(decoded.email);
    if (existingUsers.length > 0) {
      return conflict(res, "Email already exists");
    }

    const data = {
      name: decoded.name,
      email: decoded.email,
      password: decoded.passwordHash,
      created_by: 1,
    };

    const result = await createUserModel(data);
    return created(res, "User created successfully", {
      userId: result.insertId,
    });
  } catch (error) {
    console.error("registerVerifyOtp Error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return conflict(res, "Email already exists");
    }
    return serverError(res, "Failed to verify OTP for registration");
  }
};

export const loginUser = async (req, res) => {
  try {
    const body = req.validated?.body ?? req.body;
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const { password } = body;
    // 1️ Find user
    const rows = await loginUserModel(email);

    if (rows.length === 0) {
      return unauthorized(res, "User does not exist");
    }

    const user = rows[0];

    if (user.is_blocked) {
      return res.status(403).json({
        message: "Your account has been blocked by admin",
      });
    }

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

    const refreshToken = jwt.sign(
      { id: user.user_id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    await pool.query(
      `UPDATE user_master SET last_login = CURRENT_TIMESTAMP, refresh_token = ? WHERE user_id = ?`,
      [refreshToken, user.user_id],
    );

    // 4️ Success response
    return ok(res, "Login successful", { token, refreshToken, user });
  } catch (err) {
    console.error("Login Error:", err);
    return serverError(res);
  }
};

export const logoutUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Remove refresh token from DB
    await logoutUserModel(userId);

    return ok(res, "Logged out successfully");
  } catch (error) {
    console.error("Logout Error:", error);
    return serverError(res, "Something went wrong");
  }
};

//this will generete the new token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // 1️ Check refresh token exists
    if (!refreshToken) {
      return unauthorized(res, "Refresh token required");
    }

    // 2️ Verify token signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 3️ Check token exists in DB
    const rows = await refreshTokenHelper(decoded.id, refreshToken);

    if (rows.length === 0) {
      return forbidden(res, "Invalid refresh token");
    }

    // 4️ Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return ok(res, "Access token refreshed", {
      accessToken: newAccessToken,
    });
  } catch (error) {
    return forbidden(res, "Invalid or expired refresh token");
  }
};

export const viewProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return unauthorized(res, "Authentication required");
    }

    const userId = req.user.id;

    const result = await viewUserModel(userId);

    if (!result || result.length === 0) {
      return notFound(res, "User not found");
    }

    return ok(res, "Profile fetched successfully", result[0]);
  } catch (error) {
    console.error("View Profile Error:", error);
    return serverError(res, "Failed to fetch profile");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

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

    await pool.query(
      `UPDATE user_master SET refresh_token = NULL WHERE user_id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const changeEmailRequestOtp = async (req, res) => {
  try {
    if (!OTP_TOKEN_SECRET) {
      return serverError(
        res,
        "OTP_JWT_SECRET or JWT_SECRET is required for OTP flows",
      );
    }

    const userId = req.user?.id;
    if (!userId) {
      return unauthorized(res, "Authentication required");
    }

    const { newEmail } = req.validated?.body || req.body;
    const normalizedNewEmail = String(newEmail || "")
      .trim()
      .toLowerCase();
    const clientIp = getClientIp(req);

    const requestKey = `change-email:${userId}:${clientIp}`;
    const requestLimit = checkRateLimit(
      otpRequestLimiter,
      requestKey,
      OTP_REQUEST_LIMIT,
      OTP_REQUEST_WINDOW_MS,
      OTP_REQUEST_MIN_INTERVAL_MS,
    );
    if (!requestLimit.allowed) {
      const retrySeconds = formatRetrySeconds(requestLimit.retryAfterMs);
      return tooManyRequests(
        res,
        `Too many OTP requests. Please try again in ${retrySeconds} seconds.`,
      );
    }

    const profileRows = await viewUserModel(userId);
    const currentUser = profileRows?.[0];
    if (!currentUser) {
      return notFound(res, "User not found");
    }

    if (String(currentUser.email || "").toLowerCase() === normalizedNewEmail) {
      return badRequest(res, "New email must be different from current email");
    }

    const existingUsers = await loginUserModel(normalizedNewEmail);
    if (existingUsers.length > 0) {
      return conflict(res, "Email already exists");
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const otpToken = jwt.sign(
      {
        purpose: OTP_PURPOSE_EMAIL_CHANGE,
        userId,
        newEmail: normalizedNewEmail,
        otpHash,
      },
      OTP_TOKEN_SECRET,
      { expiresIn: OTP_EXPIRES_IN },
    );

    await sendOtpEmail({
      to: normalizedNewEmail,
      otp,
      purpose: OTP_PURPOSE_EMAIL_CHANGE,
    });

    const responseData = { otpToken, expiresIn: OTP_EXPIRES_IN };
    if (process.env.NODE_ENV !== "production") {
      responseData.devOtp = otp;
    }

    return ok(res, "OTP sent to your new email", responseData);
  } catch (error) {
    console.error("changeEmailRequestOtp Error:", error);
    return serverError(res, "Failed to send email change OTP");
  }
};

export const changeEmailVerifyOtp = async (req, res) => {
  try {
    if (!OTP_TOKEN_SECRET) {
      return serverError(
        res,
        "OTP_JWT_SECRET or JWT_SECRET is required for OTP flows",
      );
    }

    const userId = req.user?.id;
    if (!userId) {
      return unauthorized(res, "Authentication required");
    }

    const { newEmail, otp, otpToken } = req.validated?.body || req.body;
    const normalizedNewEmail = String(newEmail || "")
      .trim()
      .toLowerCase();
    const clientIp = getClientIp(req);

    const verifyKey = `change-email-verify:${userId}:${clientIp}`;
    const verifyLimit = checkRateLimit(
      otpVerifyLimiter,
      verifyKey,
      OTP_VERIFY_LIMIT,
      OTP_VERIFY_WINDOW_MS,
    );
    if (!verifyLimit.allowed) {
      const retrySeconds = formatRetrySeconds(verifyLimit.retryAfterMs);
      return tooManyRequests(
        res,
        `Too many OTP attempts. Please try again in ${retrySeconds} seconds.`,
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(otpToken, OTP_TOKEN_SECRET);
    } catch (error) {
      return badRequest(res, "Invalid or expired OTP token");
    }

    if (decoded.purpose !== OTP_PURPOSE_EMAIL_CHANGE) {
      return badRequest(res, "Invalid OTP purpose");
    }

    if (
      Number(decoded.userId) !== Number(userId) ||
      String(decoded.newEmail || "").toLowerCase() !== normalizedNewEmail
    ) {
      return badRequest(res, "Invalid OTP request");
    }

    const inputOtpHash = hashOtp(otp);
    if (!isHashMatch(inputOtpHash, decoded.otpHash)) {
      return badRequest(res, "Invalid OTP");
    }

    const existingUsers = await loginUserModel(normalizedNewEmail);
    const hasDifferentUser = existingUsers.some(
      (user) => Number(user.user_id) !== Number(userId),
    );
    if (hasDifferentUser) {
      return conflict(res, "Email already exists");
    }

    const result = await updateProfileModel(
      { email: normalizedNewEmail },
      userId,
    );

    if (result.affectedRows === 0) {
      return notFound(res, "User not found or already deleted");
    }

    await pool.query(
      `UPDATE user_master SET refresh_token = NULL WHERE user_id = ?`,
      [userId],
    );

    return ok(res, "Email changed successfully. Please login again.");
  } catch (error) {
    console.error("changeEmailVerifyOtp Error:", error);
    if (error?.code === "ER_DUP_ENTRY") {
      return conflict(res, "Email already exists");
    }
    return serverError(res, "Failed to verify email change OTP");
  }
};

export const deleteAccountRequestOtp = async (req, res) => {
  try {
    if (!OTP_TOKEN_SECRET) {
      return serverError(
        res,
        "OTP_JWT_SECRET or JWT_SECRET is required for OTP flows",
      );
    }

    const userId = req.user?.id;
    if (!userId) {
      return unauthorized(res, "Authentication required");
    }

    const { email } = req.validated?.body || req.body;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const clientIp = getClientIp(req);

    const requestKey = `delete-account:${userId}:${clientIp}`;
    const requestLimit = checkRateLimit(
      otpRequestLimiter,
      requestKey,
      OTP_REQUEST_LIMIT,
      OTP_REQUEST_WINDOW_MS,
      OTP_REQUEST_MIN_INTERVAL_MS,
    );
    if (!requestLimit.allowed) {
      const retrySeconds = formatRetrySeconds(requestLimit.retryAfterMs);
      return tooManyRequests(
        res,
        `Too many OTP requests. Please try again in ${retrySeconds} seconds.`,
      );
    }

    const profileRows = await viewUserModel(userId);
    const currentUser = profileRows?.[0];
    if (!currentUser) {
      return notFound(res, "User not found");
    }

    const currentEmail = String(currentUser.email || "")
      .trim()
      .toLowerCase();
    if (currentEmail !== normalizedEmail) {
      return badRequest(res, "Please enter your current account email");
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const otpToken = jwt.sign(
      {
        purpose: OTP_PURPOSE_DELETE_ACCOUNT,
        userId,
        email: normalizedEmail,
        otpHash,
      },
      OTP_TOKEN_SECRET,
      { expiresIn: OTP_EXPIRES_IN },
    );

    await sendOtpEmail({
      to: normalizedEmail,
      otp,
      purpose: OTP_PURPOSE_DELETE_ACCOUNT,
    });

    const responseData = { otpToken, expiresIn: OTP_EXPIRES_IN };
    if (process.env.NODE_ENV !== "production") {
      responseData.devOtp = otp;
    }

    return ok(res, "OTP sent to your email for account deletion", responseData);
  } catch (error) {
    console.error("deleteAccountRequestOtp Error:", error);
    return serverError(res, "Failed to send account deletion OTP");
  }
};

export const deleteAccountVerifyOtp = async (req, res) => {
  try {
    if (!OTP_TOKEN_SECRET) {
      return serverError(
        res,
        "OTP_JWT_SECRET or JWT_SECRET is required for OTP flows",
      );
    }

    const userId = req.user?.id;
    if (!userId) {
      return unauthorized(res, "Authentication required");
    }

    const { email, otp, otpToken } = req.validated?.body || req.body;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const clientIp = getClientIp(req);

    const verifyKey = `delete-account-verify:${userId}:${clientIp}`;
    const verifyLimit = checkRateLimit(
      otpVerifyLimiter,
      verifyKey,
      OTP_VERIFY_LIMIT,
      OTP_VERIFY_WINDOW_MS,
    );
    if (!verifyLimit.allowed) {
      const retrySeconds = formatRetrySeconds(verifyLimit.retryAfterMs);
      return tooManyRequests(
        res,
        `Too many OTP attempts. Please try again in ${retrySeconds} seconds.`,
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(otpToken, OTP_TOKEN_SECRET);
    } catch (error) {
      return badRequest(res, "Invalid or expired OTP token");
    }

    if (decoded.purpose !== OTP_PURPOSE_DELETE_ACCOUNT) {
      return badRequest(res, "Invalid OTP purpose");
    }

    if (
      Number(decoded.userId) !== Number(userId) ||
      String(decoded.email || "").toLowerCase() !== normalizedEmail
    ) {
      return badRequest(res, "Invalid OTP request");
    }

    const inputOtpHash = hashOtp(otp);
    if (!isHashMatch(inputOtpHash, decoded.otpHash)) {
      return badRequest(res, "Invalid OTP");
    }

    const result = await deleteByUserModel(userId);

    if (result.affectedRows === 0) {
      return notFound(res, "User not found or already deleted");
    }

    await pool.query(
      `UPDATE user_master SET refresh_token = NULL WHERE user_id = ?`,
      [userId],
    );

    return ok(res, "Account deleted successfully");
  } catch (error) {
    console.error("deleteAccountVerifyOtp Error:", error);
    return serverError(res, "Failed to verify account deletion OTP");
  }
};
//request otp for forget password
export const forgotPasswordRequestOtp = async (req, res) => {
  try {
    if (!OTP_TOKEN_SECRET) {
      return serverError(
        res,
        "OTP_JWT_SECRET or JWT_SECRET is required for OTP flows",
      );
    }

    const { email } = req.validated?.body || req.body;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const clientIp = getClientIp(req);

    const requestKey = `forgot:${normalizedEmail}:${clientIp}`;
    const requestLimit = checkRateLimit(
      otpRequestLimiter,
      requestKey,
      OTP_REQUEST_LIMIT,
      OTP_REQUEST_WINDOW_MS,
      OTP_REQUEST_MIN_INTERVAL_MS,
    );
    if (!requestLimit.allowed) {
      const retrySeconds = formatRetrySeconds(requestLimit.retryAfterMs);
      return tooManyRequests(
        res,
        `Too many OTP requests. Please try again in ${retrySeconds} seconds.`,
      );
    }

    const users = await loginUserModel(normalizedEmail);
    const user = users[0];

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const otpToken = jwt.sign(
      {
        purpose: OTP_PURPOSE_FORGOT_PASSWORD,
        email: normalizedEmail,
        userId: user?.user_id || null,
        otpHash,
      },
      OTP_TOKEN_SECRET,
      { expiresIn: OTP_EXPIRES_IN },
    );

    if (user) {
      await sendOtpEmail({
        to: normalizedEmail,
        otp,
        purpose: OTP_PURPOSE_FORGOT_PASSWORD,
      });
    }

    const responseData = { otpToken, expiresIn: OTP_EXPIRES_IN };
    if (process.env.NODE_ENV !== "production") {
      responseData.devOtp = otp;
    }

    return ok(
      res,
      "If this email is registered, an OTP has been sent",
      responseData,
    );
  } catch (error) {
    console.error("forgotPasswordRequestOtp Error:", error);
    return serverError(res, "Failed to process forgot-password OTP request");
  }
};
//verify otp for forget password
export const forgotPasswordVerifyOtp = async (req, res) => {
  try {
    if (!OTP_TOKEN_SECRET || !RESET_TOKEN_SECRET) {
      return serverError(
        res,
        "OTP_JWT_SECRET/JWT_SECRET and RESET_TOKEN_SECRET are required",
      );
    }

    const { email, otp, otpToken } = req.validated?.body || req.body;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const clientIp = getClientIp(req);

    const verifyKey = `forgot-verify:${normalizedEmail}:${clientIp}`;
    const verifyLimit = checkRateLimit(
      otpVerifyLimiter,
      verifyKey,
      OTP_VERIFY_LIMIT,
      OTP_VERIFY_WINDOW_MS,
    );
    if (!verifyLimit.allowed) {
      const retrySeconds = formatRetrySeconds(verifyLimit.retryAfterMs);
      return tooManyRequests(
        res,
        `Too many OTP attempts. Please try again in ${retrySeconds} seconds.`,
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(otpToken, OTP_TOKEN_SECRET);
    } catch (error) {
      return badRequest(res, "Invalid or expired OTP token");
    }

    if (decoded.purpose !== OTP_PURPOSE_FORGOT_PASSWORD) {
      return badRequest(res, "Invalid OTP purpose");
    }

    if (decoded.email !== normalizedEmail) {
      return badRequest(res, "Invalid OTP request");
    }

    const inputOtpHash = hashOtp(otp);
    if (!isHashMatch(inputOtpHash, decoded.otpHash)) {
      return badRequest(res, "Invalid OTP");
    }

    const users = await loginUserModel(normalizedEmail);
    const user = users[0];
    if (
      !user ||
      !decoded.userId ||
      Number(decoded.userId) !== Number(user.user_id)
    ) {
      return badRequest(res, "Invalid OTP");
    }

    const resetToken = jwt.sign(
      {
        purpose: RESET_PURPOSE_PASSWORD,
        userId: user.user_id,
        email: user.email,
      },
      RESET_TOKEN_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES_IN },
    );

    return ok(res, "OTP verified successfully", {
      resetToken,
      expiresIn: RESET_TOKEN_EXPIRES_IN,
    });
  } catch (error) {
    console.error("forgotPasswordVerifyOtp Error:", error);
    return serverError(res, "Failed to verify forgot-password OTP");
  }
};
//reset password
export const forgotPasswordResetWithToken = async (req, res) => {
  try {
    if (!RESET_TOKEN_SECRET) {
      return serverError(
        res,
        "RESET_TOKEN_SECRET or OTP_JWT_SECRET is required",
      );
    }

    const { resetToken, newPassword } = req.validated?.body || req.body;

    let decoded;
    try {
      decoded = jwt.verify(resetToken, RESET_TOKEN_SECRET);
    } catch (error) {
      return badRequest(res, "Invalid or expired reset token");
    }

    if (decoded.purpose !== RESET_PURPOSE_PASSWORD) {
      return badRequest(res, "Invalid reset token purpose");
    }

    const users = await loginUserModel(decoded.email);
    const user = users[0];

    if (!user || Number(user.user_id) !== Number(decoded.userId)) {
      return badRequest(res, "Invalid reset token");
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return badRequest(res, "New password cannot be same as old password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const affectedRows = await updateUserPassword(user.user_id, hashedPassword);

    if (affectedRows === 0) {
      return serverError(res, "Password not updated");
    }

    await pool.query(
      `UPDATE user_master SET refresh_token = NULL WHERE user_id = ?`,
      [user.user_id],
    );

    return ok(res, "Password reset successful. Please login again.");
  } catch (error) {
    console.error("forgotPasswordResetWithToken Error:", error);
    return serverError(res, "Failed to reset password");
  }
};

//admin
export const getAllUsers = async (req, res) => {
  const userId = req.user.id;
  try {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const search = String(req.query.search || "").trim();
    const role = String(req.query.role || "").trim();
    const status = String(req.query.status || "").trim();
    const sortField = String(req.query.sortField || "").trim() || "created_at";
    const sortOrder =
      String(req.query.sortOrder || "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";

    const limit = Number.isNaN(requestedLimit)
      ? 10
      : Math.min(Math.max(requestedLimit, 1), 100);

    const page = Number.isNaN(requestedPage) ? 1 : Math.max(requestedPage, 1);
    const filters = {
      search: search || undefined,
      role: role || undefined,
      status: status || undefined,
    };

    const totalUsers = await getAllUserCountModel(userId, filters);
    const totalPages = totalUsers > 0 ? Math.ceil(totalUsers / limit) : 0;
    const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
    const offset = (currentPage - 1) * limit;

    const users = await getAllUserModel(
      userId,
      { limit, offset, sortField, sortOrder },
      filters,
    );

    return paginated(
      res,
      "Users fetched successfully",
      {
        page: currentPage,
        limit,
        total: totalUsers,
        totalPages,
      },
      users,
    );
  } catch (err) {
    console.error("Get All Users Error:", err);
    return serverError(res, "Failed to fetch users");
  }
};

export const createUserByAdmin = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { name, email, role } = req.validated?.body || req.body;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!adminId) {
      return unauthorized(res, "Authentication required");
    }

    const existingUsers = await loginUserModel(normalizedEmail);
    if (existingUsers.length > 0) {
      return conflict(res, "Email already exists");
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await createUserModel({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      created_by: adminId,
      role: role || "customer",
    });

    try {
      await sendAdminCreatedEmail({
        to: normalizedEmail,
        name,
        tempPassword,
      });
    } catch (emailError) {
      console.error("Admin create user email error:", emailError);
      await deleteUserByAdminModel(result.insertId, adminId);
      return serverError(
        res,
        "Failed to send credentials email. No user was created.",
      );
    }

    return created(res, "User created successfully", {
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return conflict(res, "Email already exists");
    }
    return serverError(res, "Failed to create user");
  }
};

export const getProfileById = async (req, res) => {
  try {
    //get id from parameter
    const id = req.params.id;

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

export const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    // 1️ Validate userId
    if (!userId) {
      return badRequest(res, "User ID is required");
    }

    // 2️ Check if user exists
    const [rows] = await pool.query(
      "SELECT is_blocked FROM user_master WHERE user_id = ?",
      [userId],
    );

    if (rows.length === 0) {
      return notFound(res, "User not found");
    }

    const user = rows[0];

    // 3️ Check if already blocked
    if (Number(user.is_blocked) === 1) {
      return badRequest(res, "User is already blocked");
    }

    // 4️ Update block status
    await blockUserById(userId, adminId);

    return ok(res, "User blocked successfully");
  } catch (error) {
    console.error("Block User Error:", error);
    return serverError(res, "Internal server error");
  }
};

export const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    // 1️ Validate userId
    if (!userId) {
      return badRequest(res, "User ID is required");
    }

    // 2️ Check if user exists
    const [rows] = await pool.query(
      "SELECT is_blocked FROM user_master WHERE user_id = ?",
      [userId],
    );

    if (rows.length === 0) {
      return notFound(res, "User not found");
    }

    const user = rows[0];

    // 3️ Check if already blocked
    if (Number(user.is_blocked) === 0) {
      return badRequest(res, "User is already unblocked");
    }

    // 4️ Update block status
    await unblockUserById(userId, adminId);

    return ok(res, "User Unblocked successfully");
  } catch (error) {
    console.error("Block User Error:", error);
    return serverError(res, "Internal server error");
  }
};
