import { z } from "zod";

/* ================= REGISTER ================= */

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/* ================= LOGIN ================= */

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

/* ================= UPDATE PROFILE ================= */

export const updateProfileSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.name || data.email, {
    message: "At least one field required",
  });

/* ================= UPDATE PASSWORD ================= */

export const updatePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password required"),
    newPassword: z.string().min(8, "New password must be 8+ characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/* ================= PARAM VALIDATION ================= */

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID"),
});

