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
} from "../controllers/offer.controller.js";
import {
  validateCreateOffer,
  validateOfferIdParam,
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
 * GET api/offer/:id
 * Fetch a single offer by id
 */

router.get("/:id", validateOfferIdParam, getOfferByIdController);

/**
 * POST api/offer/create
 * Create a new offer
 */
router.post("/create", validateCreateOffer, createOfferController);

/**
 * put api/offer/:id
 * update an offer by id
 */
router.put(
  "/update/:id",
  validateOfferIdParam,
  validateUpdateOffer,
  updateOfferByIdController,
);

/**
 * delete api/offer/delete/:id
//delete offer by id
 */
router.delete("/delete/:id", validateOfferIdParam, deleteOfferByIdController);

/**
 * patch api/offer/status/:id
//status change to activeted or deactived by id
 */
router.patch(
  "/status/:id",
  validateOfferIdParam,
  validatestatusOfferIDParam,
  updateOfferStatusController,
);

router.get("/product/:id",validateOfferIdParam,getOfferByProductController)
router.get("/category/:id",validateOfferIdParam,getOfferByCategoryController)



