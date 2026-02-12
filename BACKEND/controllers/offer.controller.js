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
  getValidateOfferByName,
  getOfferUsageCount,
  getOfferUsageByOfferId,
  getOfferUsageByUserId,
  getAllOfferUsageSummary,
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
 * Create a new offer.
 * Flow:
 * - checks for conflicting offer in same scope/time window
 * - validates request payload presence (extra safety; primary validation is in middleware)
 * - persists offer record
 */
export const createOfferController = async (req, res) => {
  try {
    // Validate request payload before creating an offer.
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
 * Fetch all offers (including active/inactive and soft-delete state as returned by model query).
 */
export const getAllOfferController = async (req, res) => {
  try {
    // Fetch all offers.
    const result = await getAllOffer();
    if (!result || result.length === 0) {
      return notFound(res, "No offers found");
    }
    return ok(res, `${result.length} Offers fetched successfully`, result);
  } catch (error) {
    console.error(error);

    return serverError(res);
  }
};

/**
 * Fetch a single active, non-deleted offer by id.
 * Note: underlying model currently filters by `is_active=1` and `is_deleted=0`.
 */
export const getOfferByIdController = async (req, res) => {
  try {
    // Fetch a single offer by id.
    const offerId = req.params.id;
    const result = await getOfferById(offerId);
    if (!result || result.length === 0) {
      return notFound(res, "No offers found or deleted");
    }
    return ok(res, "Offer fetched successfully", result);
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * Update an existing offer by id.
 */
// export const updateOfferByIdController = async (req, res) => {
//   try {
//     // Read target id and update payload from request.
//     const offerId = req.params.id;
//     const offerData = req.body;
//     const result = await updateOfferById(offerId, offerData);
//     if (!result || result.affectedRows === 0) {
//       return notFound(res, "No offers found");
//     }
//     return ok(res, "Offer updated successfully");
//   } catch (error) {
//     console.error(error);
//     return serverError(res, error.message || "Internal server error");
//   }
// };

/**
 * Update an offer by id with partial payload fields.
 * Validation middleware ensures payload shape before controller runs.
 */
export const updateOfferByIdController = async (req, res) => {
  try {
    // Read target offer id from route and partial update payload from body.
    const offerId = req.params.id;
    const offerData = req.body;

    const result = await updateOfferById(offerId, offerData);

    // `affectedRows = 0` means id not found or soft-deleted.
    if (!result || result.affectedRows === 0) {
      return notFound(res, "Offer not found or already deleted");
    }

    return ok(res, "Offer updated successfully");
  } catch (error) {
    console.error(error);
    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * Soft delete an offer by id (`is_deleted=1`).
 */
export const deleteOfferByIdController = async (req, res) => {
  try {
    const offerId = req.params.id;
    const result = await deleteOfferById(offerId);

    // Soft delete only works when row exists and is not already deleted.
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
 * Update offer active status (`is_active` = 0 or 1).
 * Used by admin to activate/deactivate an offer without deleting it.
 */
export const updateOfferStatusController = async (req, res) => {
  try {
    const offerId = req.params.id;
    const isActive = req.body.is_active;

    const result = await activeupdateOfferStatusById(offerId, isActive);

    // No target row matched for update.
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
 * Fetch all active offers.
 * Returns offers where `is_active=1` and `is_deleted=0`.
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
 * Fetch all offers for a specific product id.
 * Route param `id` is interpreted as product id.
 */
export const getOfferByProductController = async (req, res) => {
  try {
    const productId = req.params.id;
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
 * Fetch all offers for a specific category id.
 * Route param `id` is interpreted as category id.
 */
export const getOfferByCategoryController = async (req, res) => {
  try {
    const categoryId = req.params.id;
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

/**
 * Validate whether an offer can be applied for the current order context.
 * Checks:
 * - active/non-expired offer in matching scope
 * - minimum purchase amount
 * - per-user usage limit
 * - discount amount and final payable total
 */
export const validateOfferController = async (req, res) => {
  try {
    // Body is pre-validated by `validateOfferPayload` middleware.
    const { offer_name, total, product_id, category_id } = req.body;

    // TODO: read user id from authenticated request context.
    const userId = 1;

    // Step 1: Fetch a currently valid offer for provided scope.
    const result = await getValidateOfferByName(
      offer_name,
      product_id,
      category_id,
    );

    if (!result || result.length === 0) {
      return badRequest(res, "Offer not valid or expired");
    }

    const offer = result[0];

    // Step 2: Enforce minimum purchase amount if configured.
    if (offer.min_purchase_amount && total < offer.min_purchase_amount) {
      return badRequest(
        res,
        `Minimum purchase amount is ${offer.min_purchase_amount}`,
      );
    }

    // Step 3: Enforce per-user usage limit if configured.
    if (offer.usage_limit_per_user) {
      const usageCount = await getOfferUsageCount(offer.offer_id, userId);

      if (usageCount >= offer.usage_limit_per_user) {
        return badRequest(res, "Offer usage limit exceeded");
      }
    }

    // Step 4: Calculate discount and final amount.
    let discountAmount = 0;
    const type = offer.discount_type.toLowerCase();

    if (type === "percentage") {
      discountAmount = (total * offer.discount_value) / 100;

      if (
        offer.maximum_discount_amount &&
        discountAmount > offer.maximum_discount_amount
      ) {
        discountAmount = offer.maximum_discount_amount;
      }
    } else if (type === "fixed_amount") {
      discountAmount = offer.discount_value;
    }

    // Consumer/order module should persist usage in `offer_usage` after successful order placement.
    return ok(res, "Offer is valid", {
      offer_id: offer.offer_id,
      discount_amount: discountAmount,
      final_amount: total - discountAmount,
    });
  } catch (error) {
    console.error(error);

    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * Fetch usage history rows for a given offer id.
 */
export const getOfferUsageByOfferIdController = async (req, res) => {
  try {
    // Route param `id` here represents `offer_id`.
    const offerId = req.params.id;

    const result = await getOfferUsageByOfferId(offerId);

    if (!result || result.length === 0) {
      return notFound(res, "No usage found for this offer by given offer id");
    }

    return ok(res, `Offer used ${result.length} times by given offer id`, {
      usage_details: result,
    });
  } catch (error) {
    console.error(error);

    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * Fetch usage history rows for a given user id.
 * Response includes both count and detailed usage rows.
 */
export const getOfferUsageByUserIdController = async (req, res) => {
  try {
    // Route param `id` here represents `user_id`.
    const userId = req.params.id;

    const result = await getOfferUsageByUserId(userId);

    if (!result || result.length === 0) {
      return notFound(res, "No usage found for this offer by given user id");
    }

    return ok(res, `Offer used ${result.length} times by given user id`, {
      total_usage: result.length,
      usage_details: result,
    });
  } catch (error) {
    console.error(error);

    return serverError(res, error.message || "Internal server error");
  }
};

/**
 * Fetch aggregated usage analytics for all offers.
 * Intended for admin/reporting dashboards.
 */
export const getAllOfferUsageSummaryController = async (req, res) => {
  try {
    const result = await getAllOfferUsageSummary();

    return ok(res, "Offer usage summary fetched successfully", result);
  } catch (error) {
    console.error(error);

    return serverError(res, error.message);
  }
};
