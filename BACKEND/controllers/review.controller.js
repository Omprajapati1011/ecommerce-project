import jwt from "jsonwebtoken";
import "../configs/env.js";
import {
  badRequest,
  conflict,
  created,
  forbidden,
  notFound,
  ok as success,
  serverError,
} from "../utils/apiResponse.js";
import {
  getAllReviewsAdmin,
  getProductRatingSummary,
  getProductRatingSummariesBulk,
  getReviewById,
  getReviewsByProduct,
  hardDeleteReview,
  reviewModel,
  toggleHelpful,
  updateReview,
} from "../models/review.model.js";

// Normalize user id from JWT payload formats.
const resolveAuthUserId = (req) => {
  const rawUserId =
    req.user?.user_id ?? req.user?.id ?? req.user?.userId ?? req.user?.sub;

  const userId = Number(rawUserId);
  return Number.isFinite(userId) ? userId : null;
};

// Extract optional logged-in user from Authorization header for public APIs.
const getOptionalUserIdFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const resolved =
      decoded?.user_id ??
      decoded?.id ??
      decoded?.userId ??
      decoded?.sub ??
      null;
    const userId = Number(resolved);
    return Number.isFinite(userId) ? userId : null;
  } catch (error) {
    return null;
  }
};

// Review controller containing all review endpoints.
export const reviewController = {
  // POST /api/review
  create: async (req, res) => {
    try {
      // Step 1 - Validate request body and role.
      if (req.user?.role !== "customer") {
        return forbidden(res, "Only customers can create reviews");
      }
      const authUserId = resolveAuthUserId(req);
      if (!authUserId) {
        return badRequest(res, "Invalid token payload: user_id is missing");
      }

      const { product_id, order_id, rating, title, review_text } =
        req.validatedBody ?? req.body;

      // Step 2 - Check product exists.
      const productExists = await reviewModel.checkProductExists(product_id);
      if (!productExists) {
        return notFound(res, "Product not found or inactive");
      }

      // Step 3 - Check user purchased product.
      const purchased = await reviewModel.checkUserPurchased(
        authUserId,
        product_id,
      );
      if (!purchased) {
        return badRequest(
          res,
          "You can review only delivered purchased products",
        );
      }

      // Step 4 - Check already reviewed.
      const alreadyReviewed = await reviewModel.checkAlreadyReviewed(
        authUserId,
        product_id,
      );
      if (alreadyReviewed) {
        return conflict(res, "You have already reviewed this product");
      }

      if (order_id !== undefined && order_id !== null) {
        const orderMatches = await reviewModel.checkOrderForPurchase(
          order_id,
          authUserId,
          product_id,
        );

        if (!orderMatches) {
          return badRequest(
            res,
            "Provided order_id is invalid for this delivered purchase",
          );
        }
      }

      // Step 5 - Create review.
      const review_id = await reviewModel.create({
        product_id,
        user_id: authUserId,
        order_id: order_id ?? null,
        rating,
        title: title ?? null,
        review_text: review_text ?? null,
        is_verified_purchase: order_id ? 1 : 0,
        created_by: authUserId,
        updated_by: authUserId,
      });

      // Step 6 - Return response.
      const review = await getReviewById(review_id);
      return created(res, "Review created successfully", review);
    } catch (error) {
      console.error("Create review error:", error);
      return serverError(res, "Internal server error");
    }
  },

  // GET /api/review/product/:product_id
  getByProduct: async (req, res) => {
    try {
      // Step 1 - Validate params and query.
      const { product_id } = req.validatedParams ?? req.params;
      const { page, limit, sort, rating, verified } =
        req.validatedQuery ?? req.query;

      // Step 2 - Check product exists.
      const productExists = await reviewModel.checkProductExists(product_id);
      if (!productExists) {
        return notFound(res, "Product not found");
      }

      // Step 3 - Resolve logged-in user optionally.
      const user_id = getOptionalUserIdFromToken(req);

      // Step 4 - Fetch paginated reviews with filters/sort.
      const data = await getReviewsByProduct(
        Number(product_id),
        { page, limit, sort, rating, verified },
        user_id,
      );

      // Step 5 - Return response.
      return success(res, "Product reviews fetched successfully", data);
    } catch (error) {
      console.error("Get reviews by product error:", error);
      return serverError(res, "Internal server error");
    }
  },

  // GET /api/review/product/:product_id/summary
  getSummary: async (req, res) => {
    try {
      // Step 1 - Validate params.
      const { product_id } = req.validatedParams ?? req.params;

      // Step 2 - Check product exists.
      const productExists = await reviewModel.checkProductExists(product_id);
      if (!productExists) {
        return notFound(res, "Product not found");
      }

      // Step 3 - Calculate summary.
      const summary = await getProductRatingSummary(Number(product_id));

      // Step 4 - Return response.
      return success(
        res,
        "Product rating summary fetched successfully",
        summary,
      );
    } catch (error) {
      console.error("Get review summary error:", error);
      return serverError(res, "Internal server error");
    }
  },

  // POST /api/review/product/summary/bulk
  getBulkSummary: async (req, res) => {
    try {
      const { product_ids } = req.validatedBody ?? req.body;
      const summaries = await getProductRatingSummariesBulk(product_ids);

      return success(
        res,
        "Product rating summaries fetched successfully",
        summaries,
      );
    } catch (error) {
      console.error("Get review summaries bulk error:", error);
      return serverError(res, "Internal server error");
    }
  },

  // GET /api/review/:review_id
  getById: async (req, res) => {
    try {
      // Step 1 - Validate params.
      const { review_id } = req.validatedParams ?? req.params;

      // Step 2 - Fetch review.
      const review = await getReviewById(Number(review_id));
      if (!review) {
        return notFound(res, "Review not found");
      }

      // Step 3 - Return response.
      return success(res, "Review fetched successfully", review);
    } catch (error) {
      console.error("Get review by id error:", error);
      return serverError(res, "Internal server error");
    }
  },

  // PUT /api/review/:review_id
  update: async (req, res) => {
    try {
      // Step 1 - Validate role and request.
      if (req.user?.role !== "customer") {
        return forbidden(res, "Only customers can update reviews");
      }
      const authUserId = resolveAuthUserId(req);
      if (!authUserId) {
        return badRequest(res, "Invalid token payload: user_id is missing");
      }

      const { review_id } = req.validatedParams ?? req.params;
      const { rating, title, review_text } = req.validatedBody ?? req.body;

      // Step 2 - Check review exists.
      const reviewMeta = await reviewModel.getReviewMetaById(Number(review_id));
      if (!reviewMeta) {
        return notFound(res, "Review not found");
      }

      // Step 3 - Check ownership.
      if (Number(reviewMeta.user_id) !== authUserId) {
        return forbidden(res, "You can update only your own review");
      }

      // Step 4 - Build update payload.
      const updateData = {};
      if (rating !== undefined) updateData.rating = rating;
      if (title !== undefined) updateData.title = title;
      if (review_text !== undefined) updateData.review_text = review_text;

      if (Object.keys(updateData).length === 0) {
        return badRequest(res, "No fields provided for update");
      }

      // Step 5 - Update review.
      await updateReview(Number(review_id), updateData, authUserId);

      // Step 6 - Return response.
      const updatedReview = await getReviewById(Number(review_id));
      return success(res, "Review updated successfully", updatedReview);
    } catch (error) {
      console.error("Update review error:", error);
      return serverError(res, "Internal server error");
    }
  },

  // DELETE /api/review/:review_id
  delete: async (req, res) => {
    try {
      // Step 1 - Validate params.
      const { review_id } = req.validatedParams ?? req.params;
      const authUserId = resolveAuthUserId(req);
      if (!authUserId) {
        return badRequest(res, "Invalid token payload: user_id is missing");
      }

      // Step 2 - Check review exists.
      const reviewMeta = await reviewModel.getReviewMetaById(Number(review_id));
      if (!reviewMeta) {
        return notFound(res, "Review not found");
      }

      // Step 3 - Authorize customer/admin.
      if (req.user?.role === "customer") {
        if (Number(reviewMeta.user_id) !== authUserId) {
          return forbidden(res, "You can delete only your own review");
        }
      } else if (req.user?.role !== "admin") {
        return forbidden(res, "You are not authorized to delete this review");
      }

      // Step 4 - Hard delete review.
      await hardDeleteReview(Number(review_id));

      // Step 5 - Return response.
      return success(res, "Review deleted successfully");
    } catch (error) {
      console.error("Delete review error:", error);
      return serverError(res, "Internal server error");
    }
  },

  // GET /api/review/admin (admin only)
  getAllAdmin: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        rating,
        sortField = "created_at",
        sortOrder = "desc",
      } = req.query;

      const data = await getAllReviewsAdmin({
        page,
        limit,
        search,
        rating: rating ? Number(rating) : null,
        sortField,
        sortOrder,
      });

      return success(res, "Reviews fetched successfully", data);
    } catch (error) {
      console.error("Get admin reviews error:", error);
      return serverError(res, "Internal server error");
    }
  },

  // PATCH /api/review/:review_id/helpful
  toggleHelpful: async (req, res) => {
    try {
      // Step 1 - Validate params.
      const { review_id } = req.validatedParams ?? req.params;
      const authUserId = resolveAuthUserId(req);
      if (!authUserId) {
        return badRequest(res, "Invalid token payload: user_id is missing");
      }

      // Step 2 - Check review exists.
      const reviewMeta = await reviewModel.getReviewMetaById(Number(review_id));
      if (!reviewMeta) {
        return notFound(res, "Review not found");
      }

      // Step 3 - Toggle helpful like/unlike.
      const result = await toggleHelpful(Number(review_id), authUserId);

      // Step 4 - Return response.
      return success(res, `Review ${result.action} successfully`, result);
    } catch (error) {
      if (error.message === "REVIEW_NOT_FOUND") {
        return notFound(res, "Review not found");
      }
      if (error.message === "HELPFUL_TABLE_MISSING") {
        return badRequest(
          res,
          "review_helpful table is missing. Please create review_helpful table first.",
        );
      }

      console.error("Toggle helpful error:", error);
      return serverError(res, "Internal server error");
    }
  },
};
