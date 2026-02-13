import express from "express";
import {
  createOfferController,
  deleteOfferByIdController,
  getActiveOfferController,
  getAllOfferController,
  getOfferByIdController,
  getOfferByCategoryController,
  getOfferByProductController,
  updateOfferByIdController,
  updateOfferStatusController,
  validateOfferController,
  getOfferUsageByOfferIdController,
  getOfferUsageByUserIdController,
  getAllOfferUsageSummaryController,
} from "../controllers/offer.controller.js";
import {
  validateCreateOffer,
  validateOfferIdParam,
  validateOfferPayload,
  validatestatusOfferIDParam,
  validateUpdateOffer,
} from "../middlewares/offer.validator.js";
import {
  auth, // verifies authenticated user
  adminOnly, // allows only admin users
} from "../middlewares/auth.middleware.js";

// ============================================================================
// OFFER ROUTES
// ============================================================================

export const route = express.Router();

// ============================================================================
// OFFER MASTER ROUTES
// ============================================================================

/**
 * GET api/offer
 * Fetch all offers
 */
route.get("/", auth, adminOnly, getAllOfferController);

/**
 * GET api/offer/active
 * Fetch all active offers
 */
route.get("/active", auth, adminOnly, getActiveOfferController);

/**
 * POST api/offer/create
 * Create a new offer
 */
route.post(
  "/create",
  auth,
  adminOnly,
  validateCreateOffer,
  createOfferController,
);

/**
 * POST api/offer/validate
 * Validate if offer can be applied
 */
route.post(
  "/validate",
  auth,
  adminOnly,
  validateOfferPayload,
  validateOfferController,
);

/**
 * GET api/offer/usage/summary
 * Fetch summary of all offers usage (admin analytics)
 */
route.patch(
  "/update/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  validateUpdateOffer,
  updateOfferByIdController,
);

/**
 * delete api/offer/delete/:id
 * delete offer by id
 */
route.delete(
  "/delete/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  deleteOfferByIdController,
);

/**
 * patch api/offer/status/:id
 * status change to activated or deactivated by id
 */
route.patch(
  "/status/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  validatestatusOfferIDParam,
  updateOfferStatusController,
);

/**
 * GET api/offer/product/:id
 * Fetch offers by product id
 */
route.get(
  "/product/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  getOfferByProductController,
);

/**
 * GET api/offer/category/:id
 * Fetch offers by category id
 */
route.get(
  "/category/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  getOfferByCategoryController,
);

// ============================================================================
// OFFER USAGE ROUTES
// ============================================================================

/**
 * GET api/offer/usage/summary
 * Fetch summary of all offers usage (admin analytics)
 */
route.get("/usage/summary", auth, adminOnly, getAllOfferUsageSummaryController);

/**
 * GET api/offer/usagebyoffer/:id
 * Fetch offer usage details by offer id
 */
route.get(
  "/usagebyoffer/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  getOfferUsageByOfferIdController,
);

/**
 * GET api/offer/usagebyuser/:id
 * Fetch offer usage details by user id
 */
route.get(
  "/usagebyuser/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  getOfferUsageByUserIdController,
);

/**
 * GET api/offer/:id
 * Fetch a single offer by id
 */

route.get(
  "/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  getOfferByIdController,
);
