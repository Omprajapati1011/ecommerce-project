import { z } from "zod";

/*
==============================
REGISTER
==============================
*/
export const registerSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),

  email: z.string().trim().email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be minimum 6 characters")
    .max(20, "Password too long"),
});

/*
==============================
LOGIN
==============================
*/
export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password required"),
});
