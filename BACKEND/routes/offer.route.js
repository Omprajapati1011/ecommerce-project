import express from "express";
import {
  createOfferController,
  createOfferProductCategoryMappingController,
  deleteOfferProductCategoryMappingByIdController,
  getAllOfferProductCategoryMappingsController,
  getOfferProductCategoryMappingsByOfferIdController,
  updateOfferProductCategoryMappingByIdController,
  deleteOfferByIdController,
  getActiveOfferController,
  getAllOfferController,
  getOfferByCategoryIdController,
  getOfferByIdController,
  getOfferByProductIdController,
  getVisibleOffersByProductIdController,
  updateOfferByIdController,
  updateOfferStatusController,
  validateOfferController,
  getOfferUsageByOfferIdController,
  getOfferUsageByUserIdController,
  getAllOfferUsageSummaryController,
} from "../controllers/offer.controller.js";
import {
  validateCreateOffer,
  validateCreateOfferProductCategory,
  validateCategoryIdParam,
  validateOfferProductCategoryIdParam,
  validateOfferProductCategoryOfferIdParam,
  validateOfferIdParam,
  validateProductIdParam,
  validateUserIdParam,
  validateOfferPayload,
  validateUpdateOfferProductCategory,
  validateStatusOfferIDParam,
  validateUpdateOffer,
} from "../middlewares/offer.validator.js";
import {
  auth, // verifies authenticated user
  adminOnly, // allows only admin users
} from "../middlewares/auth.middleware.js";
import { validateCart } from "../middlewares/cart.middleware.js";

// // ============================================================================
// // OFFER ROUTES
// // ============================================================================

export const route = express.Router();

// // ============================================================================
// // OFFER MASTER ROUTES
// // ============================================================================

// /**
//  * GET api/offer
//  * Fetch all offers
//  */
route.get("/", auth, adminOnly, getAllOfferController);

/**
 * GET api/offer/active
 * Fetch all active offers (accessible to all authenticated users including customers)
 */
route.get("/active", auth, getActiveOfferController);

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
 * Validate if offer can be applied (accessible to customers for their carts)
 */
route.post(
  "/validate",
  auth,
  validateCart,
  validateOfferPayload,
  validateOfferController,
);

// /**
//  * PATCH api/offer/update/:id
//  * Update offer by id
//  */
route.patch(
  "/update/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  validateUpdateOffer,
  updateOfferByIdController,
);
// /**
//  * delete api/offer/delete/:id
//  * delete offer by id
//  */
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
  validateStatusOfferIDParam,
  updateOfferStatusController,
);

// // ============================================================================
// // OFFER PRODUCT CATEGORY MAPPING ROUTES
// // ============================================================================

// /**
//  * POST api/offer/mapping/create
//  * Create offer to product/category mapping
//  */
route.post(
  "/mapping/create",
  auth,
  adminOnly,
  validateCreateOfferProductCategory,
  createOfferProductCategoryMappingController,
);

// /**
//  * GET api/offer/mapping
//  * Fetch all mappings
//  */
route.get(
  "/mapping",
  auth,
  adminOnly,
  getAllOfferProductCategoryMappingsController,
);

// /**
//  * GET api/offer/mapping/offer/:id
//  * Fetch all mappings for a given offer id
//  */
route.get(
  "/mapping/offer/:id",
  auth,
  adminOnly,
  validateOfferProductCategoryOfferIdParam,
  getOfferProductCategoryMappingsByOfferIdController,
);

// /**
//  * PATCH api/offer/mapping/update/:id
//  * Update mapping (is_active and/or product/category scope)
//  */
route.patch(
  "/mapping/update/:id",
  auth,
  adminOnly,
  validateOfferProductCategoryIdParam,
  validateUpdateOfferProductCategory,
  updateOfferProductCategoryMappingByIdController,
);

// /**
//  * DELETE api/offer/mapping/delete/:id
//  * Soft delete mapping by id
//  */
route.delete(
  "/mapping/delete/:id",
  auth,
  adminOnly,
  validateOfferProductCategoryIdParam,
  deleteOfferProductCategoryMappingByIdController,
);

// // ============================================================================
// // OFFER USAGE ROUTES
// // ============================================================================

// /**
//  * GET api/offer/usage/summary
//  * Fetch summary of all offers usage (admin analytics)
//  */
route.get("/usage/summary", auth, adminOnly, getAllOfferUsageSummaryController);

// /**
//  * GET api/offer/usagebyoffer/:id
//  * Fetch offer usage details by offer id
//  */
route.get(
  "/usagebyoffer/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  getOfferUsageByOfferIdController,
);

// /**
//  * GET api/offer/usagebyuser/:id
//  * Fetch offer usage details by user id
//  */
route.get(
  "/usagebyuser/:id",
  auth,
  adminOnly,
  validateUserIdParam,
  getOfferUsageByUserIdController,
);

/**
 * GET api/offer/product/:id
 * Fetch active offers for a given product id
 */
route.get(
  "/product/:id",
  auth,
  validateProductIdParam,
  getOfferByProductIdController,
);

/**
 * GET api/offer/product/:id/visible
 * Fetch both product and category offers visible for a given product id
 */
route.get(
  "/product/:id/visible",
  auth,
  validateProductIdParam,
  getVisibleOffersByProductIdController,
);

/**
 * GET api/offer/category/:id
 * Fetch active offers for a given category id
 */
route.get(
  "/category/:id",
  auth,
  validateCategoryIdParam,
  getOfferByCategoryIdController,
);

// /**
//  * GET api/offer/:id
//  * Fetch a single offer by id
//  */

route.get(
  "/:id",
  auth,
  adminOnly,
  validateOfferIdParam,
  getOfferByIdController,
);
