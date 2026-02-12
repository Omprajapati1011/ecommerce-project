import { z } from "zod";

/* ================= REGISTER ================= */

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
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

/* ================= ADDRESS VALIDATION ================= */

export const addressSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid Indian mobile number"),
  address_line1: z.string().min(5, "Address line 1 is required").max(255),

  address_line2: z.string().max(255).optional(),

  city: z
    .string()
    .min(2, "City is required")
    .max(100)
    .regex(/^[a-zA-Z\s]+$/, "City must contain only letters"),

  state: z
    .string()
    .min(2, "State is required")
    .max(100)
    .regex(/^[a-zA-Z\s]+$/, "State must contain only letters"),

  postal_code: z
    .string()
    .min(4)
    .max(10)
    .regex(/^[0-9A-Za-z\s-]+$/, "Invalid postal code"),

  country: z.string().min(2).max(100),

  is_default: z.boolean().optional(),
});

export const updateAddressSchema = z
  .object({
    full_name: z.string().min(2).optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/)
      .optional(),
    address_line1: z.string().min(5).optional(),
    address_line2: z.string().optional(),
    city: z
      .string()
      .regex(/^[a-zA-Z\s]+$/)
      .optional(),
    state: z
      .string()
      .regex(/^[a-zA-Z\s]+$/)
      .optional(),
    postal_code: z
      .string()
      .regex(/^[1-9][0-9]{5}$/)
      .optional(),
    country: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });
