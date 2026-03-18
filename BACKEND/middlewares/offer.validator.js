import { z } from "zod";
import { validationError } from "../utils/apiResponse.js";

// ============================================================================
// OFFER VALIDATION SCHEMAS
// ============================================================================

/**
 * Base payload rules for creating an offer.
 * Cross-field/business constraints are applied in `refineOfferCreate`.
 * Notes:
 * - `z.coerce.number()` allows numeric strings from form-data/JSON.
 */
const offerCreateBaseSchema = z.object({
  offer_name: z
    .string({ required_error: "offer_name is required" })
    .trim()
    .min(1, "offer_name cannot be empty"),

  description: z.string().trim().optional().nullable(),

  offer_type: z
    .string({ required_error: "offer_type is required" })
    .trim()
    .min(1, "offer_type cannot be empty"),

  discount_type: z
    .string({ required_error: "discount_type is required" })
    .trim()
    .min(1, "discount_type cannot be empty"),

  discount_value: z.coerce
    .number({ invalid_type_error: "discount_value must be a number" })
    .min(0, "discount_value must be 0 or greater"),
  maximum_discount_amount: z.coerce
    .number({
      invalid_type_error: "maximum_discount_amount must be a number",
    })
    .min(0, "maximum_discount_amount must be 0 or greater"),

  min_purchase_amount: z.coerce
    .number({ invalid_type_error: "min_purchase_amount must be a number" })
    .min(0, "min_purchase_amount must be 0 or greater")
    .optional()
    .nullable(),

  usage_limit_per_user: z.coerce
    .number({ invalid_type_error: "usage_limit_per_user must be a number" })
    .int("usage_limit_per_user must be an integer")
    .min(1, "usage_limit_per_user must be 0 or greater")
    .optional()
    .nullable(),

  start_date: z
    .string({ required_error: "start_date is required" })
    .trim()
    .min(1, "start_date cannot be empty"),

  end_date: z
    .string({ required_error: "end_date is required" })
    .trim()
    .min(1, "end_date cannot be empty"),

  start_time: z.string().trim().optional().nullable(),

  end_time: z.string().trim().optional().nullable(),

  is_active: z.coerce
    .number({ invalid_type_error: "is_active must be 0 or 1" })
    .int("is_active must be an integer")
    .min(0, "is_active must be 0 or 1")
    .max(1, "is_active must be 0 or 1")
    .default(1),

  is_deleted: z.coerce
    .number({ invalid_type_error: "is_deleted must be 0 or 1" })
    .int("is_deleted must be an integer")
    .min(0, "is_deleted must be 0 or 1")
    .max(1, "is_deleted must be 0 or 1")
    .default(0),
});

/**
 * Base payload rules for updating an offer.
 * All fields are optional for partial updates.
 * Cross-field/business constraints are applied in `refineOfferUpdate`.
 * Unknown keys are ignored by default zod object behavior in this setup.
 */
const offerUpdateBaseSchema = z.object({
  offer_name: z.string().trim().min(1, "offer_name cannot be empty").optional(),

  description: z.string().trim().optional().nullable(),

  offer_type: z.string().trim().min(1, "offer_type cannot be empty").optional(),

  discount_type: z
    .string()
    .trim()
    .min(1, "discount_type cannot be empty")
    .optional(),

  discount_value: z.coerce
    .number({ invalid_type_error: "discount_value must be a number" })
    .min(0, "discount_value must be 0 or greater")
    .optional(),

  maximum_discount_amount: z.coerce
    .number({
      invalid_type_error: "maximum_discount_amount must be a number",
    })
    .min(0, "maximum_discount_amount must be 0 or greater")
    .optional(),

  min_purchase_amount: z.coerce
    .number({ invalid_type_error: "min_purchase_amount must be a number" })
    .min(0, "min_purchase_amount must be 0 or greater")
    .optional()
    .nullable(),

  usage_limit_per_user: z.coerce
    .number({ invalid_type_error: "usage_limit_per_user must be a number" })
    .int("usage_limit_per_user must be an integer")
    .min(1, "usage_limit_per_user must be 0 or greater")
    .optional()
    .nullable(),

  start_date: z.string().trim().min(1, "start_date cannot be empty").optional(),

  end_date: z.string().trim().min(1, "end_date cannot be empty").optional(),

  start_time: z.string().trim().optional().nullable(),

  end_time: z.string().trim().optional().nullable(),

  is_active: z.coerce
    .number({ invalid_type_error: "is_active must be 0 or 1" })
    .int("is_active must be an integer")
    .min(0, "is_active must be 0 or 1")
    .max(1, "is_active must be 0 or 1")
    .optional(),

  is_deleted: z.coerce
    .number({ invalid_type_error: "is_deleted must be 0 or 1" })
    .int("is_deleted must be an integer")
    .min(0, "is_deleted must be 0 or 1")
    .max(1, "is_deleted must be 0 or 1")
    .optional(),

  created_by: z.coerce
    .number({ invalid_type_error: "created_by must be a number" })
    .int("created_by must be an integer")
    .min(1, "created_by is required")
    .optional(),

  updated_by: z.coerce
    .number({ invalid_type_error: "updated_by must be a number" })
    .int("updated_by must be an integer")
    .min(1, "updated_by is required")
    .optional(),
});

const normalizeDateOnly = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeTimeOnly = (value) => {
  if (!value) return null;
  const match = String(value)
    .trim()
    .match(/^(\d{2}:\d{2})/);
  return match ? match[1] : null;
};

/**
 * Create-offer business validation:
 * - Enforces valid date range
 * - Enforces valid time range when both times are provided
 */
const refineOfferCreate = (schema) =>
  schema.superRefine((data, ctx) => {
    const today = normalizeDateOnly(new Date());
    const startDateOnly = normalizeDateOnly(data.start_date);
    const endDateOnly = normalizeDateOnly(data.end_date);
    const currentTime = normalizeTimeOnly(new Date().toTimeString());
    const startTimeOnly = normalizeTimeOnly(data.start_time);
    const endTimeOnly = normalizeTimeOnly(data.end_time);

    if (startDateOnly && today && startDateOnly < today) {
      ctx.addIssue({
        path: ["start_date"],
        message: "start_date cannot be in the past",
      });
    }

    if (
      startDateOnly &&
      today &&
      startDateOnly === today &&
      startTimeOnly &&
      currentTime &&
      startTimeOnly < currentTime
    ) {
      ctx.addIssue({
        path: ["start_time"],
        message: "start_time cannot be in the past for today",
      });
    }

    if (
      endDateOnly &&
      today &&
      endDateOnly === today &&
      endTimeOnly &&
      currentTime &&
      endTimeOnly <= currentTime
    ) {
      ctx.addIssue({
        path: ["end_time"],
        message: "end_time must be in the future for today",
      });
    }

    if (
      data.discount_type === "fixed_amount" &&
      Number.isFinite(data.discount_value) &&
      Number.isFinite(data.maximum_discount_amount) &&
      data.maximum_discount_amount < data.discount_value
    ) {
      ctx.addIssue({
        path: ["maximum_discount_amount"],
        message:
          "maximum_discount_amount cannot be less than discount_value for fixed_amount",
      });
    }

    // Date validation
    if (startDateOnly && endDateOnly) {
      if (new Date(data.start_date) > new Date(data.end_date)) {
        ctx.addIssue({
          path: ["start_date"],
          message: "start_date must be before end_date",
        });
      }
    }

    // Time validation (only if both times exist on the same day)
    if (
      startDateOnly &&
      endDateOnly &&
      startDateOnly === endDateOnly &&
      data.start_time &&
      data.end_time &&
      data.start_time >= data.end_time
    ) {
      ctx.addIssue({
        path: ["start_time"],
        message: "start_time must be before end_time",
      });
    }
  });

/**
 * Update-offer business validation:
 * - Enforces valid date range when both dates are provided
 * - Enforces valid time range when both times are provided
 */
const refineOfferUpdate = (schema) =>
  schema.superRefine((data, ctx) => {
    const today = normalizeDateOnly(new Date());
    const startDateOnly = normalizeDateOnly(data.start_date);
    const endDateOnly = normalizeDateOnly(data.end_date);
    const currentTime = normalizeTimeOnly(new Date().toTimeString());
    const startTimeOnly = normalizeTimeOnly(data.start_time);
    const endTimeOnly = normalizeTimeOnly(data.end_time);

    if (
      startDateOnly &&
      today &&
      startDateOnly === today &&
      startTimeOnly &&
      currentTime &&
      startTimeOnly < currentTime
    ) {
      ctx.addIssue({
        path: ["start_time"],
        message: "start_time cannot be in the past for today",
      });
    }

    if (
      endDateOnly &&
      today &&
      endDateOnly === today &&
      endTimeOnly &&
      currentTime &&
      endTimeOnly <= currentTime
    ) {
      ctx.addIssue({
        path: ["end_time"],
        message: "end_time must be in the future for today",
      });
    }

    if (
      data.discount_type === "fixed_amount" &&
      Number.isFinite(data.discount_value) &&
      Number.isFinite(data.maximum_discount_amount) &&
      data.maximum_discount_amount < data.discount_value
    ) {
      ctx.addIssue({
        path: ["maximum_discount_amount"],
        message:
          "maximum_discount_amount cannot be less than discount_value for fixed_amount",
      });
    }

    // Date validation (only if both exist)
    if (startDateOnly && endDateOnly) {
      if (new Date(data.start_date) > new Date(data.end_date)) {
        ctx.addIssue({
          path: ["start_date"],
          message: "start_date must be before end_date",
        });
      }
    }

    // Time validation (only if both times exist on the same day)
    if (
      startDateOnly &&
      endDateOnly &&
      startDateOnly === endDateOnly &&
      data.start_time &&
      data.end_time &&
      data.start_time >= data.end_time
    ) {
      ctx.addIssue({
        path: ["start_time"],
        message: "start_time must be before end_time",
      });
    }
  });

/**
 * Final schema used by create-offer endpoint.
 */
const createOfferSchema = refineOfferCreate(offerCreateBaseSchema);

/**
 * Route param validation for offer id based endpoints.
 */
const offerIdParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: "id is required",
      invalid_type_error: "id must be a number",
    })
    .int("id must be an integer")
    .min(1, "id must be a positive number"),
});

/**
 * Route param validation for user id based endpoints.
 */
const userIdParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: "id is required",
      invalid_type_error: "id must be a number",
    })
    .int("id must be an integer")
    .min(1, "id must be a positive number"),
});

/**
 * Route param validation for product id based endpoints.
 */
const productIdParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: "id is required",
      invalid_type_error: "id must be a number",
    })
    .int("id must be an integer")
    .min(1, "id must be a positive number"),
});

/**
 * Route param validation for category id based endpoints.
 */
const categoryIdParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: "id is required",
      invalid_type_error: "id must be a number",
    })
    .int("id must be an integer")
    .min(1, "id must be a positive number"),
});

/**
 * Final schema used by update-offer endpoint.
 * Also ensures at least one field is present in request body.
 */
const updateOfferSchema = refineOfferUpdate(offerUpdateBaseSchema).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required",
  },
);

/**
 * Payload schema for toggling offer status.
 */
const statusChangeOfferSchema = z.object({
  is_active: z.coerce
    .number({ invalid_type_error: "is_active must be 0 or 1" })
    .int("is_active must be an integer")
    .min(0, "is_active must be 0 or 1")
    .max(1, "is_active must be 0 or 1"),
});

/**
 * Payload schema for validating whether an offer can be applied.
 * Required:
 * - `offer_name`
 */
const validateOfferSchema = z
  .object({
    offer_name: z
      .string({ required_error: "offer_name is required" })
      .trim()
      .min(1, "offer_name cannot be empty"),

    product_id: z.coerce
      .number({ invalid_type_error: "product_id must be a number" })
      .int("product_id must be an integer")
      .min(1, "product_id must be a positive number")
      .optional()
      .nullable(),

    category_id: z.coerce
      .number({ invalid_type_error: "category_id must be a number" })
      .int("category_id must be an integer")
      .min(1, "category_id must be a positive number")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.product_id && data.category_id) {
      ctx.addIssue({
        path: ["product_id"],
        message: "Provide only one: product_id or category_id",
      });
    }
  });

// ============================================================================
// OFFER PRODUCT CATEGORY MAPPING VALIDATION SCHEMAS
// ============================================================================

/**
 * Payload schema for creating offer_product_category mapping.
 * Requires:
 * - offer_id
 * - at most one of product_id/category_id
 *   (both can be null for flat_discount offers; controller enforces offer-type rules)
 */
const createOfferProductCategorySchema = z
  .object({
    offer_id: z.coerce
      .number({ invalid_type_error: "offer_id must be a number" })
      .int("offer_id must be an integer")
      .min(1, "offer_id must be a positive number"),

    product_id: z.coerce
      .number({ invalid_type_error: "product_id must be a number" })
      .int("product_id must be an integer")
      .min(1, "product_id must be a positive number")
      .optional()
      .nullable(),

    category_id: z.coerce
      .number({ invalid_type_error: "category_id must be a number" })
      .int("category_id must be an integer")
      .min(1, "category_id must be a positive number")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.product_id && data.category_id) {
      ctx.addIssue({
        path: ["product_id"],
        message: "Provide only one: product_id or category_id",
      });
    }
  });

/**
 * Route param schema for mapping-by-offer endpoint.
 */
const offerProductCategoryByOfferIdParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: "id is required",
      invalid_type_error: "id must be a number",
    })
    .int("id must be an integer")
    .min(1, "id must be a positive number"),
});

/**
 * Route param schema for mapping update endpoint.
 */
const offerProductCategoryIdParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: "id is required",
      invalid_type_error: "id must be a number",
    })
    .int("id must be an integer")
    .min(1, "id must be a positive number"),
});

/**
 * Payload schema for updating offer_product_category mapping.
 * Allowed:
 * - product_id
 * - category_id
 * - is_active
 */
const updateOfferProductCategorySchema = z
  .object({
    product_id: z.coerce
      .number({ invalid_type_error: "product_id must be a number" })
      .int("product_id must be an integer")
      .min(1, "product_id must be a positive number")
      .optional()
      .nullable(),

    category_id: z.coerce
      .number({ invalid_type_error: "category_id must be a number" })
      .int("category_id must be an integer")
      .min(1, "category_id must be a positive number")
      .optional()
      .nullable(),

    is_active: z.coerce
      .number({ invalid_type_error: "is_active must be 0 or 1" })
      .int("is_active must be an integer")
      .min(0, "is_active must be 0 or 1")
      .max(1, "is_active must be 0 or 1")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.product_id && data.category_id) {
      ctx.addIssue({
        path: ["product_id"],
        message: "Provide only one: product_id or category_id",
      });
    }
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Generic request validator.
 * Parses and sanitizes a selected request source (`body`, `params`, etc.),
 * then normalizes validation errors to the API response contract.
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      // Normalize zod issues into common API error format.
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return validationError(res, errors);
    }

    req[source] = result.data;
    return next();
  };
};

// ============================================================================
// EXPORTED MIDDLEWARES (mapped by route use-case)
// ============================================================================

/**
 * Validate create-offer payload
 */
export const validateCreateOffer = validate(createOfferSchema, "body");

/**
 * Validate offer id route param
 */
export const validateOfferIdParam = validate(offerIdParamSchema, "params");

/**
 * Validate user id route param
 */
export const validateUserIdParam = validate(userIdParamSchema, "params");

/**
 * Validate product id route param
 */
export const validateProductIdParam = validate(productIdParamSchema, "params");

/**
 * Validate category id route param
 */
export const validateCategoryIdParam = validate(
  categoryIdParamSchema,
  "params",
);

/**
 * Validate update-offer payload
 */
export const validateUpdateOffer = validate(updateOfferSchema, "body");

/**
 * Validate delete-offer route param (same schema as generic offer id).
 */
export const validateDeleteOfferIDParam = validate(
  offerIdParamSchema,
  "params",
);
/**
 * Validate activate/deactivate payload (`is_active` 0|1).
 */
export const validateStatusOfferIDParam = validate(
  statusChangeOfferSchema,
  "body",
);

/**
 * Validate offer application payload
 */
export const validateOfferPayload = validate(validateOfferSchema, "body");

// ============================================================================
// OFFER PRODUCT CATEGORY MAPPING VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate create offer-product/category mapping payload
 */
export const validateCreateOfferProductCategory = validate(
  createOfferProductCategorySchema,
  "body",
);

/**
 * Validate id route param for mapping-by-offer endpoint.
 */
export const validateOfferProductCategoryOfferIdParam = validate(
  offerProductCategoryByOfferIdParamSchema,
  "params",
);

/**
 * Validate mapping id route param for mapping update endpoint.
 */
export const validateOfferProductCategoryIdParam = validate(
  offerProductCategoryIdParamSchema,
  "params",
);

/**
 * Validate update offer-product/category mapping payload.
 */
export const validateUpdateOfferProductCategory = validate(
  updateOfferProductCategorySchema,
  "body",
);
