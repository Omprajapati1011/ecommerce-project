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
 * - Scope (`product_id` vs `category_id`) is enforced in superRefine.
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
    .min(1, "discount_value must be 0 or greater"),

  maximum_discount_amount: z.coerce
    .number({
      invalid_type_error: "maximum_discount_amount must be a number",
    })
    .min(0, "maximum_discount_amount must be 0 or greater"),

  min_purchase_amount: z.coerce
    .number({ invalid_type_error: "min_purchase_amount must be a number" })
    .min(1, "min_purchase_amount must be 0 or greater")
    .optional()
    .nullable(),

  usage_limit_per_user: z.coerce
    .number({ invalid_type_error: "usage_limit_per_user must be a number" })
    .int("usage_limit_per_user must be an integer")
    .min(1, "usage_limit_per_user must be 0 or greater")
    .optional()
    .nullable(),

  category_id: z.coerce
    .number({ invalid_type_error: "category_id must be a number" })
    .int("category_id must be an integer")
    .min(1, "category_id must be a positive number")
    .optional()
    .nullable(),

  product_id: z.coerce
    .number({ invalid_type_error: "product_id must be a number" })
    .int("product_id must be an integer")
    .min(1, "product_id must be a positive number")
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

  created_by: z.coerce
    .number({ invalid_type_error: "created_by must be a number" })
    .int("created_by must be an integer")
    .min(1, "created_by is required"),

  updated_by: z.coerce
    .number({ invalid_type_error: "updated_by must be a number" })
    .int("updated_by must be an integer")
    .min(1, "updated_by is required"),
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
    .min(1, "discount_value must be 0 or greater")
    .optional(),

  maximum_discount_amount: z.coerce
    .number({
      invalid_type_error: "maximum_discount_amount must be a number",
    })
    .min(0, "maximum_discount_amount must be 0 or greater")
    .optional(),

  min_purchase_amount: z.coerce
    .number({ invalid_type_error: "min_purchase_amount must be a number" })
    .min(1, "min_purchase_amount must be 0 or greater")
    .optional()
    .nullable(),

  usage_limit_per_user: z.coerce
    .number({ invalid_type_error: "usage_limit_per_user must be a number" })
    .int("usage_limit_per_user must be an integer")
    .min(1, "usage_limit_per_user must be 0 or greater")
    .optional()
    .nullable(),

  category_id: z.coerce
    .number({ invalid_type_error: "category_id must be a number" })
    .int("category_id must be an integer")
    .min(1, "category_id must be a positive number")
    .optional()
    .nullable(),

  product_id: z.coerce
    .number({ invalid_type_error: "product_id must be a number" })
    .int("product_id must be an integer")
    .min(1, "product_id must be a positive number")
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

/**
 * Create-offer business validation:
 * - Requires exactly one target: `product_id` or `category_id`
 * - Enforces valid date range
 * - Enforces valid time range when both times are provided
 */
const refineOfferCreate = (schema) =>
  schema.superRefine((data, ctx) => {
    // Exactly one of product_id or category_id is required
    if (!data.product_id && !data.category_id) {
      ctx.addIssue({
        path: ["product_id"],
        message: "Either product_id or category_id is required",
      });
    }
    // Exactly one of product_id or category_id is required, not both
    if (data.product_id && data.category_id) {
      ctx.addIssue({
        path: ["product_id"],
        message: "Provide only one: product_id or category_id",
      });
    }

    // Date validation
    if (data.start_date && data.end_date) {
      if (new Date(data.start_date) > new Date(data.end_date)) {
        ctx.addIssue({
          path: ["start_date"],
          message: "start_date must be before end_date",
        });
      }
    }

    // Time validation (only if both exist)
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
      ctx.addIssue({
        path: ["start_time"],
        message: "start_time must be before end_time",
      });
    }
  });

/**
 * Update-offer business validation:
 * - Disallows providing both `product_id` and `category_id`
 * - Enforces valid date range when both dates are provided
 * - Enforces valid time range when both times are provided
 */
const refineOfferUpdate = (schema) =>
  schema.superRefine((data, ctx) => {
    // Only validate product_id/category_id if provided
    if (data.product_id && data.category_id) {
      ctx.addIssue({
        path: ["product_id"],
        message: "Provide only one: product_id or category_id",
      });
    }

    // Date validation (only if both exist)
    if (data.start_date && data.end_date) {
      if (new Date(data.start_date) > new Date(data.end_date)) {
        ctx.addIssue({
          path: ["start_date"],
          message: "start_date must be before end_date",
        });
      }
    }

    // Time validation (only if both exist)
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
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
 * - `total`
 * Scope:
 * - Exactly one of `product_id` or `category_id`
 */
const validateOfferSchema = z
  .object({
    offer_name: z
      .string({ required_error: "offer_name is required" })
      .trim()
      .min(1, "offer_name cannot be empty"),

    total: z.coerce
      .number({ invalid_type_error: "total must be a number" })
      .min(1, "total must be greater than 0"),

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
    // Offer must target one scope, otherwise query becomes ambiguous.
    if (!data.product_id && !data.category_id) {
      ctx.addIssue({
        path: ["product_id"],
        message: "Either product_id or category_id is required",
      });
    }

    // Avoid conflicting scope filters in the same request.
    if (data.product_id && data.category_id) {
      ctx.addIssue({
        path: ["product_id"],
        message: "Provide only one: product_id or category_id",
      });
    }
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
export const validatestatusOfferIDParam = validate(statusChangeOfferSchema, "body");

/**
 * Validate offer application payload
 */
export const validateOfferPayload = validate(validateOfferSchema, "body");
