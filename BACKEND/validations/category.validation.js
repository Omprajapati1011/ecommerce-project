// import { z } from "zod";

// // id in params
// export const idParamSchema = z.object({
//   id: z.coerce.number().int().positive(),
// });

// /*
// ==============================
// SEARCH
// ==============================
// */
// export const searchQuerySchema = z.object({
//   name: z.string().trim().optional().default(""),

//   page: z.coerce.number().min(1).optional().default(1),

//   limit: z.coerce.number().min(1).max(50).optional().default(5),
// });

// /*
// ==============================
// CREATE
// ==============================
// */
// export const createCategorySchema = z.object({
//   name: z.string().trim().min(2, "Category name required"),

//   parent_id: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
// });

// /*
// ==============================
// UPDATE
// ==============================
// */
// export const updateCategorySchema = z.object({
//   name: z.string().trim().min(2).optional(),

//   parent_id: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
// });

// src/validators/category.validator.js

import { z } from "zod";

/*
========================================
COMMON
========================================
*/

// params :id
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid category id"),
});

/*
========================================
SEARCH (GET /search?name=&page=&limit=)
========================================
*/
export const searchQuerySchema = z.object({
  name: z.string().trim().max(100, "Search too long").optional().default(""),

  page: z.coerce.number().int().min(1, "Page must be >= 1").default(1),

  limit: z.coerce.number().int().min(1).max(50, "Limit max 50").default(5),
});

/*
========================================
CREATE
========================================
*/
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name required")
    .max(100, "Name too long"),

  // main category => null
  parent_id: z
    .union([z.coerce.number().int().positive(), z.null()])
    .optional()
    .default(null),
});

/*
========================================
UPDATE
========================================
*/
export const updateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Category name required")
      .max(100)
      .optional(),

    parent_id: z
      .union([z.coerce.number().int().positive(), z.null()])
      .optional(),
  })
  // ❗ IMPORTANT → prevent empty update
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
