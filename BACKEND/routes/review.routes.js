import express from "express";
import {
  auth as authMiddleware,
  adminOnly,
} from "../middlewares/auth.middleware.js";
import { reviewController } from "../controllers/review.controller.js";
import {
  createReviewSchema,
  bulkProductSummarySchema,
  getReviewsQuerySchema,
  productIdParamSchema,
  reviewIdParamSchema,
  updateReviewSchema,
  validateBody,
  validateParams,
  validateQuery,
} from "../validations/review.validation.js";

const router = express.Router();

// Create review (customer only).
router.post(
  "/",
  authMiddleware,
  validateBody(createReviewSchema),
  reviewController.create,
);

// Product rating summary (public).
router.get(
  "/product/:product_id/summary",
  validateParams(productIdParamSchema),
  reviewController.getSummary,
);

// Product rating summaries bulk (public).
router.post(
  "/product/summary/bulk",
  validateBody(bulkProductSummarySchema),
  reviewController.getBulkSummary,
);

// Product reviews listing with filters/sort/pagination (public).
router.get(
  "/product/:product_id",
  validateParams(productIdParamSchema),
  validateQuery(getReviewsQuerySchema),
  reviewController.getByProduct,
);

// Admin: Get all reviews with filters/pagination (admin only).
router.get("/admin", authMiddleware, adminOnly, reviewController.getAllAdmin);

// Single review details (public).
router.get(
  "/:review_id",
  validateParams(reviewIdParamSchema),
  reviewController.getById,
);

// Update review (customer only, own review).
router.put(
  "/updateReview/:review_id",
  authMiddleware,
  validateParams(reviewIdParamSchema),
  validateBody(updateReviewSchema),
  reviewController.update,
);

// Hard delete review (customer own review or admin).
router.delete(
  "/deleteReview/:review_id",
  authMiddleware,
  validateParams(reviewIdParamSchema),
  reviewController.delete,
);

// Toggle helpful like/unlike (logged-in users).
router.patch(
  "/:review_id/helpful",
  authMiddleware,
  validateParams(reviewIdParamSchema),
  reviewController.toggleHelpful,
);

export default router;
