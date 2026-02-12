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

// ============================================================================
// OFFER ROUTES
// ============================================================================

export const router = express.Router();

/**
 * GET api/offer
 * Fetch all offers
 */
router.get("/", getAllOfferController);

/**
 * GET api/offer/active
 * Fetch all active offers
 */
router.get("/active", getActiveOfferController);

/**
 * POST api/offer/create
 * Create a new offer
 */
router.post("/create", validateCreateOffer, createOfferController);

/**
 * POST api/offer/validate
 * Validate if offer can be applied
 */
router.post("/validate", validateOfferPayload, validateOfferController);

/**
 * GET api/offer/usage/summary
 * Fetch summary of all offers usage (admin analytics)
 */
router.get(
  "/usage/summary",
  getAllOfferUsageSummaryController
);

/**
 * patch api/offer/:id
 * update an offer by id
 */
router.patch(
  "/update/:id",
  validateOfferIdParam,
  validateUpdateOffer,
  updateOfferByIdController,
);

/**
 * delete api/offer/delete/:id
 * delete offer by id
 */
router.delete("/delete/:id", validateOfferIdParam, deleteOfferByIdController);

/**
 * patch api/offer/status/:id
 * status change to activated or deactivated by id
 */
router.patch(
  "/status/:id",
  validateOfferIdParam,
  validatestatusOfferIDParam,
  updateOfferStatusController,
);

/**
 * GET api/offer/product/:id
 * Fetch offers by product id
 */
router.get("/product/:id", validateOfferIdParam, getOfferByProductController);

/**
 * GET api/offer/category/:id
 * Fetch offers by category id
 */
router.get("/category/:id", validateOfferIdParam, getOfferByCategoryController);

/**
 * GET api/offer/usagebyoffer/:id
 * Fetch offer usage details by offer id
 */
router.get("/usagebyoffer/:id", validateOfferIdParam, getOfferUsageByOfferIdController);

/**
 * GET api/offer/usagebyuser/:id
 * Fetch offer usage details by user id
 */
router.get("/usagebyuser/:id", validateOfferIdParam, getOfferUsageByUserIdController);


/**
 * GET api/offer/:id
 * Fetch a single offer by id
 */

router.get("/:id", validateOfferIdParam, getOfferByIdController);


