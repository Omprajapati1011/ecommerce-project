// Modifier Validation Schemas - Zod schemas for request validation

import { z } from "zod";

// ============================================================================
// MODIFIER MASTER SCHEMAS
// ============================================================================

// Schema for creating a new modifier
export const createModifierSchema = z.object({
  modifier_name: z
    .string()
    .min(1, "Modifier name is required")
    .max(100, "Modifier name cannot exceed 100 characters"),
  modifier_value: z
    .string()
    .min(1, "Modifier value is required")
    .max(100, "Modifier value cannot exceed 100 characters"),
  modifier_type: z
    .string()
    .max(50, "Modifier type cannot exceed 50 characters")
    .optional()
    .nullable(),
  additional_price: z.number().min(0, "Price cannot be negative").optional(),
});

// Schema for updating a modifier
export const updateModifierSchema = z.object({
  modifier_name: z
    .string()
    .min(1, "Modifier name is required")
    .max(100, "Modifier name cannot exceed 100 characters")
    .optional(),
  modifier_value: z
    .string()
    .min(1, "Modifier value is required")
    .max(100, "Modifier value cannot exceed 100 characters")
    .optional(),
  modifier_type: z
    .string()
    .max(50, "Modifier type cannot exceed 50 characters")
    .optional()
    .nullable(),
  additional_price: z.number().min(0, "Price cannot be negative").optional(),
  is_active: z.boolean().optional(),
});

// Schema for deleting a modifier (no body needed, ID comes from URL)
export const deleteModifierSchema = z.object({});

// // Schema for partial update (all fields optional)
// export const patchModifierSchema = z.object({
//   modifier_name: z.string().min(1, "Modifier name cannot be empty").optional(),
//   modifier_value: z
//     .string()
//     .min(1, "Modifier value cannot be empty")
//     .optional(),
//   additional_price: z.number().min(0, "Price cannot be negative").optional(),
//   is_active: z.boolean().optional(),
// });

// ============================================================================
// MODIFIER PORTION SCHEMAS
// ============================================================================

// Schema for creating a modifier-portion link
export const createModifierPortionSchema = z.object({
  modifier_id: z
    .number()
    .int()
    .positive("Modifier ID must be a positive integer"),
  product_portion_id: z
    .number()
    .int()
    .positive("Product portion ID must be a positive integer")
    .optional()
    .nullable(),
  product_id: z
    .number()
    .int()
    .positive("Product ID must be a positive integer")
    .optional()
    .nullable(),
  additional_price: z.number().min(0, "Price cannot be negative").optional(),
  stock: z.number().int().min(0, "Stock cannot be negative").optional(),
});

// Schema for updating a modifier portion
export const updateModifierPortionSchema = z.object({
  additional_price: z.number().min(0, "Price cannot be negative").optional(),
  stock: z.number().int().min(0, "Stock cannot be negative").optional(),
  is_active: z.boolean().optional(),
});

// Schema for deleting a modifier portion (no body needed, ID comes from URL)
export const deleteModifierPortionSchema = z.object({});

// // Schema for partial update of modifier portion (all fields optional)
// export const patchModifierPortionSchema = z.object({
//   additional_price: z.number().min(0, "Price cannot be negative").optional(),
//   stock: z.number().int().min(0, "Stock cannot be negative").optional(),
//   is_active: z.boolean().optional(),
// });
