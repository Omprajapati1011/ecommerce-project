import {
  activeupdateOfferStatusById,
  checkOfferExist,
  createOffer,
  deleteOfferById,
  getActiveOffer,
  getAllOffer,
  getOfferById,
  getOfferByCategoryId,
  getOfferByProductId,
  updateOfferById,
} from "../models/offer.model.js";
import {
  badRequest,
  conflict,
  created,
  notFound,
  noContent,
  ok,
  serverError,
} from "../utils/apiResponse.js";

// ============================================================================
// OFFER CONTROLLERS
// ============================================================================

/**
 * Create a new offer
 * Validates request body and persists offer data
 */
export const createOfferController = async (req, res) => {
  try {
    // Validate request payload before creating an offer
    const offerData = req.body;
    const exists = await checkOfferExist(offerData);

    if (exists) {
      return conflict(
        res,
        "Offer already exists for this product/category in the same time slot",
      );
    }
    if (!offerData || Object.keys(offerData).length === 0) {
      return badRequest(res, "Request body is required");
    }
    const result = await createOffer(offerData);

    return created(res, "Offer created successfully", {
      offer_id: result.insertId,
    });
  } catch (error) {
    console.error(error);

    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * Get all offers
 */
export const getAllOfferController = async (req, res) => {
  try {
    // Fetch all offers
    const result = await getAllOffer();
    if (!result || result.length === 0) {
      return notFound(res, "No offers found");
    }
    return ok(res, "Offers fetched successfully", result);
  } catch (error) {
    console.error(error);

    return serverError(res);
  }
};

/**
 * Get an offer by id
 */
export const getOfferByIdController = async (req, res) => {
  try {
    // Fetch a single offer by id
    const offerId = req.params.id;
    const result = await getOfferById(offerId);
    if (!result || result.length === 0) {
      return notFound(res, "No offers found");
    }
    return ok(res, "Offer fetched successfully", result);
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * update an offer by id
 */
export const updateOfferByIdController = async (req, res) => {
  try {
    //fetch offerid to update an offer
    const offerId = req.params.id;
    const offerData = req.body;
    const result = await updateOfferById(offerId, offerData);
    if (!result || result.affectedRows === 0) {
      return notFound(res, "No offers found");
    }
    return ok(res, "Offer updated successfully");
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * soft delete an offer by id
 */
export const deleteOfferByIdController = async (req, res) => {
  try {
    const offerId = req.params.id;
    const result = await deleteOfferById(offerId);
    if (!result || result.affectedRows === 0) {
      return notFound(res, "No offers found");
    }

    return ok(res, "Offer deleted successfully");
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * activate deactivate offer status is_active to 0 or 1
 */
export const updateOfferStatusController = async (req, res) => {
  try {
    const offerId = req.params.id;
    const isActive = req.body.is_active;

    const result = await activeupdateOfferStatusById(offerId, isActive);

    if (!result || result.affectedRows === 0) {
      return notFound(res, "No offers found");
    }

    return ok(
      res,
      isActive === 1
        ? "Offer activated successfully"
        : "Offer deactivated successfully",
    );
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * get all active offer controller
 */
export const getActiveOfferController = async (req, res) => {
  try {
    const result = await getActiveOffer();
    if (!result || result.length === 0) {
      return notFound(res, "No offers found");
    }
    return ok(res, "Active Offers fetched successfully", result);
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * get offer for the productid controller
 */
export const getOfferByProductController = async (req, res) => {
  try {
    const productId=req.params.id;
    const result = await getOfferByProductId(productId);
    if (!result || result.length === 0) {
      return notFound(res, "No offers found with this productid");
    }
    return ok(res, " Offers with this productid fetched successfully", result);
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * get offer for the categoryid controller
 */
export const getOfferByCategoryController = async (req, res) => {
  try {
    const categoryId=req.params.id
    const result = await getOfferByCategoryId(categoryId);
    if (!result || result.length === 0) {
      return notFound(res, "No offers found with this categoryid");
    }
    return ok(res, " Offers with this categoryid fetched successfully", result);
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};