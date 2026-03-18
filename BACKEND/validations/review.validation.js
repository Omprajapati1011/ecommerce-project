import { z } from "zod";
import { validationError } from "../utils/apiResponse.js";

// Body validation for creating a new review.
export const createReviewSchema = z.object({
  product_id: z
    .coerce
    .number({ required_error: "product_id is required", invalid_type_error: "product_id must be a number" })
    .int("product_id must be an integer")
    .positive("product_id must be positive"),
  rating: z
    .coerce
    .number({ required_error: "rating is required", invalid_type_error: "rating must be a number" })
    .int("rating must be an integer")
    .min(1, "rating minimum is 1")
    .max(5, "rating maximum is 5"),
  title: z
    .string({ invalid_type_error: "title must be a string" })
    .max(200, "title must be at most 200 characters")
    .optional()
    .nullable(),
  review_text: z
    .string({ invalid_type_error: "review_text must be a string" })
    .optional()
    .nullable(),
  order_id: z
    .coerce
    .number({ invalid_type_error: "order_id must be a number" })
    .int("order_id must be an integer")
    .positive("order_id must be positive")
    .optional()
    .nullable(),
});

// Body validation for updating an existing review.
export const updateReviewSchema = z
  .object({
    rating: z
      .coerce
      .number({ invalid_type_error: "rating must be a number" })
      .int("rating must be an integer")
      .min(1, "rating minimum is 1")
      .max(5, "rating maximum is 5")
      .optional(),
    title: z
      .string({ invalid_type_error: "title must be a string" })
      .max(200, "title must be at most 200 characters")
      .optional()
      .nullable(),
    review_text: z
      .string({ invalid_type_error: "review_text must be a string" })
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

// Route param validation for product id.
export const productIdParamSchema = z.object({
  product_id: z.coerce
    .number({ required_error: "product_id is required", invalid_type_error: "product_id must be a number" })
    .int("product_id must be an integer")
    .positive("product_id must be positive"),
});

// Route param validation for review id.
export const reviewIdParamSchema = z.object({
  review_id: z.coerce
    .number({ required_error: "review_id is required", invalid_type_error: "review_id must be a number" })
    .int("review_id must be an integer")
    .positive("review_id must be positive"),
});

// Query validation for reviews listing endpoint.
export const getReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z.enum(["newest", "helpful", "highest", "lowest"]).optional().default("newest"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  verified: z.coerce.number().int().min(0).max(1).optional(),
});

// Body validation for bulk product rating summaries.
export const bulkProductSummarySchema = z.object({
  product_ids: z
    .array(
      z.coerce
        .number({ invalid_type_error: "product_ids must be an array of numbers" })
        .int("product_id must be an integer")
        .positive("product_id must be positive"),
    )
    .min(1, "product_ids must include at least one id")
    .max(100, "product_ids must include at most 100 ids"),
});

// Generic validator helper for body/params/query.
const validateWith = (schema, source, targetKey) => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    return validationError(res, errors, "Validation failed");
  }

  req[targetKey] = result.data;
  return next();
};

// Middleware builders.
export const validateBody = (schema) => validateWith(schema, "body", "validatedBody");
export const validateParams = (schema) => validateWith(schema, "params", "validatedParams");
export const validateQuery = (schema) => validateWith(schema, "query", "validatedQuery");
