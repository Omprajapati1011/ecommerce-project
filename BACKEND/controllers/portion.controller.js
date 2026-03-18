import {
  createPortion,
  getAllPortion,
  getPortionById,
  updatePortion,
  deletePortion,
  toggleActivePortion,
  //  for the product master table
  AssignPortionTOProduct,
  getProductPortions,
  getProductPortionById,
  getAllProductPortions,
  updateProductPortion,
  toggleActiveProductPortion,
  deleteProductPortion,
} from "../models/portion.model.js";

import {
  created,
  ok,
  notFound,
  conflict,
  badRequest,
  serverError,
} from "../utils/apiResponse.js";

// Controller for creating new portion
export const createPortionController = {
  createPortion: async (req, res) => {
    try {
      const { portion_value, description, is_active } =
        req.validatedBody ?? req.body;

      // Check for duplicate portion value
      const isDuplicate =
        await createPortion.checkPortionValueExists(portion_value);
      if (isDuplicate) {
        return conflict(res, `Portion '${portion_value}' already exists`);
      }

      const portionData = {
        portion_value,
        description: description ?? null,
        is_active: is_active !== undefined ? is_active : 1,
        created_by: req.user?.id || 1,
      };

      const result = await createPortion.create(portionData);

      return created(res, "Portion created successfully", result);
    } catch (error) {
      console.error("Create portion error:", error);
      return serverError(res, "Internal server error");
    }
  },
};

// Controller for retrieving all portions
export const getAllPortionController = async (req, res) => {
  try {
    const getPortions = await getAllPortion();

    if (!getPortions || getPortions.length == 0) {
      return notFound(res, "portion not found");
    }
    return ok(res, "All Portions", getPortions);
  } catch (error) {
    console.error("Get portion error:", error);
    return serverError(res, "Internal server error");
  }
};

// Controller for retrieving portion by ID
export const getPortionByIdController = async (req, res) => {
  try {
    const { portion_id } = req.validatedParams ?? req.params;

    const PortionById = await getPortionById(portion_id);

    if (!PortionById) {
      return notFound(res, "Portion by this ID not found");
    }

    return ok(res, "Portion by id get", PortionById);
  } catch (error) {
    console.error("Get portion id does not exist error:", error);
    return serverError(res, "Internal server error for getPortionById");
  }
};

// Controller for updating portion details
export const updatePortionController = async (req, res) => {
  try {
    const { portion_id } = req.validatedParams ?? req.params;
    const { portion_value, description, is_active } =
      req.validatedBody ?? req.body;
    const updated_by = req.user?.id || 1;

    const result = await updatePortion(
      portion_id,
      portion_value,
      description,
      is_active,
      updated_by,
    );

    if (!result) {
      return notFound(res, "Portion not found or already deleted");
    }

    return ok(res, "Portion updated successfully");
  } catch (error) {
    console.error("updated portion error", error);
    return serverError(res, "Internal server error for UpdatePortionById");
  }
};

// Controller for toggling portion active status
export const toggleActivePortionController = async (req, res) => {
  try {
    const portion_id = Number((req.validatedParams ?? req.params).portion_id);
    const updated_by = req.user?.id || 1;

    const result = await toggleActivePortion(portion_id, updated_by);

    if (!result) {
      return notFound(res, "Portion not found or already deleted");
    }

    return ok(res, "Portion active status toggled successfully");
  } catch (error) {
    console.error("toggle portion error", error);
    return serverError(res, "Internal server error");
  }
};

// Controller for deleting portion (soft delete)
export const deletePortionController = async (req, res) => {
  try {
    const { portion_id } = req.validatedParams ?? req.params;
    const updated_by = req.user?.id || 1;

    const result = await deletePortion(portion_id, updated_by);

    if (!result) {
      return notFound(res, "Portion not found or already deleted");
    }

    return ok(res, "Portion soft delete successfully");
  } catch (error) {
    console.error("delete portion error", error);
    return serverError(res, "Internal server error for DeleteById");
  }
};

// for the product master table

//  Assign portion to product
export const createProductPortionController = async (req, res) => {
  try {
    const {
      product_id,
      portion_id,
      price,
      discounted_price,
      stock,
      is_active,
    } = req.validatedBody ?? req.body;

    // Check if product exists
    const productExists =
      await AssignPortionTOProduct.checkProductExists(product_id);
    if (!productExists) {
      return notFound(res, "Product not found");
    }

    // Check if portion exists
    const portionExists =
      await AssignPortionTOProduct.checkPortionExists(portion_id);
    if (!portionExists) {
      return notFound(res, "Portion not found");
    }

    // Check duplicate combination
    const isDuplicate = await AssignPortionTOProduct.checkProductPortionExists(
      product_id,
      portion_id,
    );
    if (isDuplicate) {
      return conflict(res, "This portion is already assigned to the product");
    }

    // Create product portion
    const portionData = {
      product_id,
      portion_id,
      price,
      discounted_price: discounted_price ?? null,
      stock: stock ?? 0,
      is_active: is_active !== undefined ? is_active : 1,
      created_by: req.user?.id || 1,
    };

    const result = await AssignPortionTOProduct.create(portionData);

    return created(res, "Product portion created successfully", result);
  } catch (error) {
    console.error("Create product portion error:", error);
    return serverError(res, "Internal server error");
  }
};

// Get all portions of a product
export const getProductPortionsController = async (req, res) => {
  try {
    const { product_id } = req.validatedParams ?? req.params;

    // Check if product exists
    const productExists =
      await AssignPortionTOProduct.checkProductExists(product_id);
    if (!productExists) {
      return notFound(res, "Product not found");
    }

    const portions = await getProductPortions(product_id);

    return ok(res, "Product portions fetched successfully", portions);
  } catch (error) {
    console.error("Get product portions error:", error);
    return serverError(res, "Internal server error");
  }
};

// Get single product portion
export const getProductPortionByIdController = async (req, res) => {
  try {
    const product_portion_id = Number(
      (req.validatedParams ?? req.params).product_portion_id,
    );

    // Get product portion
    const productPortion = await getProductPortionById(product_portion_id);

    if (!productPortion) {
      return notFound(res, "Product portion not found");
    }

    return ok(res, "Product portion fetched successfully", productPortion);
  } catch (error) {
    console.error("Get product portion error:", error);
    return serverError(res, "Internal server error");
  }
};

// Get all product portions (admin)
export const getAllProductPortionsController = async (req, res) => {
  try {
    const portions = await getAllProductPortions();

    return ok(res, "All product portions fetched successfully", portions);
  } catch (error) {
    console.error("Get all product portions error:", error);
    return serverError(res, "Internal server error");
  }
};

//  Update product portion
export const updateProductPortionController = async (req, res) => {
  try {
    const product_portion_id = Number(
      (req.validatedParams ?? req.params).product_portion_id,
    );
    const { price, discounted_price, stock, is_active } =
      req.validatedBody ?? req.body;

    // Check if product portion exists .......................may be on the controller this apply so todo..................
    const exists = await getProductPortionById(product_portion_id);
    if (!exists) {
      return notFound(res, "Product portion not found");
    }

    // Prepare update data
    const updateData = {};

    if (price !== undefined) updateData.price = price;
    if (discounted_price !== undefined)
      updateData.discounted_price = discounted_price;
    if (stock !== undefined) updateData.stock = stock;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return badRequest(
        res,
        "Nothing to update, please provide at least one field",
      );
    }

    const updated_by = req.user?.id ?? 1;

    // Update with error handling
    try {
      const result = await updateProductPortion(
        product_portion_id,
        updateData,
        updated_by,
      );
      return ok(res, "Product portion updated successfully", result);
    } catch (error) {
      if (error.message === "INVALID_DISCOUNT") {
        return badRequest(
          res,
          "Discounted price must be less than regular price",
        );
      }
      if (error.message === "INVALID_STOCK") {
        return badRequest(res, "Stock cannot be negative");
      }
      if (error.message === "NO_FIELDS_TO_UPDATE") {
        return badRequest(res, "Nothing to update");
      }
      throw error; // Re-throw unknown errors
    }
  } catch (error) {
    console.error("Update product portion error:", error);
    return serverError(res, "Internal server error");
  }
};

// Controller for toggling product_portion active status
export const toggleActiveProductPortionController = async (req, res) => {
  try {
    const { product_portion_id } = req.validatedParams ?? req.params;
    const updated_by = req.user?.id || 1;

    const result = await toggleActiveProductPortion(
      product_portion_id,
      updated_by,
    );

    if (!result) {
      return notFound(res, "product_portion not found or already deleted");
    }

    return ok(res, "product_portion active status toggled successfully");
  } catch (error) {
    console.error("toggle product_portion error", error);
    return serverError(res, "Internal server error");
  }
};

// Controller for deleting product_portion (soft delete)
export const deleteProductPortionController = async (req, res) => {
  try {
    const product_portion_id = Number(
      (req.validatedParams ?? req.params).product_portion_id,
    );
    const updated_by = req.user?.id || 1;

    const result = await deleteProductPortion(product_portion_id, updated_by);

    if (!result) {
      return notFound(res, "ProductPortion not found or already deleted");
    }

    return ok(res, "product_portion soft delete successfully");
  } catch (error) {
    console.error("delete product_portion error", error);
    return serverError(res, "Internal server error for DeleteById");
  }
};
