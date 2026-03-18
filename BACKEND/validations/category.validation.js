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

export const multiCategoryQuerySchema = z.object({
  ids: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      return value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    },
    z
      .array(z.coerce.number().int().positive("Each category id must be > 0"))
      .min(1, "At least one category id is required")
      .max(100, "Maximum 100 category ids are allowed")
      .transform((ids) => [...new Set(ids)]),
  ),
});

export const multiCategoryProductsQuerySchema = z.object({
  ids: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      return value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    },
    z
      .array(z.coerce.number().int().positive("Each category id must be > 0"))
      .min(1, "At least one category id is required")
      .max(100, "Maximum 100 category ids are allowed")
      .transform((ids) => [...new Set(ids)]),
  ),
  page: z.coerce.number().int().min(1, "Page must be >= 1").optional(),
  limit: z.coerce.number().int().min(1).max(50, "Limit max 50").optional(),
});

const parseIdList = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return value;
  const list = value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
};

export const categoryProductFilterQuerySchema = z.object({
  ids: z.preprocess(
    parseIdList,
    z
      .array(z.coerce.number().int().positive("Each category id must be > 0"))
      .max(100, "Maximum 100 category ids are allowed")
      .transform((ids) => [...new Set(ids)])
      .optional(),
  ),
  parent_ids: z.preprocess(
    parseIdList,
    z
      .array(z.coerce.number().int().positive("Each category id must be > 0"))
      .max(100, "Maximum 100 category ids are allowed")
      .transform((ids) => [...new Set(ids)])
      .optional(),
  ),
  child_ids: z.preprocess(
    parseIdList,
    z
      .array(z.coerce.number().int().positive("Each category id must be > 0"))
      .max(100, "Maximum 100 category ids are allowed")
      .transform((ids) => [...new Set(ids)])
      .optional(),
  ),
  search: z.string().trim().max(100, "Search too long").optional().default(""),
  min_price: z.coerce.number().min(0, "Min price must be >= 0").optional(),
  max_price: z.coerce.number().min(0, "Max price must be >= 0").optional(),
  page: z.coerce.number().int().min(1, "Page must be >= 1").optional(),
  limit: z.coerce.number().int().min(1).max(50, "Limit max 50").optional(),
});

// Body schema for category product filters (same shape as query).
export const categoryProductFilterBodySchema = categoryProductFilterQuerySchema;

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
