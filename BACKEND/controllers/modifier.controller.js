// Modifier Controllers - Business logic for modifier API endpoints

import {
  getAllModifiers,
  getModifierById,
  getModifierByIdForAdmin,
  checkModifierExists,
  createModifier,
  updateModifier,
  deleteModifier,
  toggleModifierActive,
  getModifierPortions,
  getModifierPortionById,
  getModifierPortionByIdForAdmin,
  getModifiersByProductPortion,
  getModifiersByProduct,
  checkProductPortionExists,
  createModifierPortion,
  updateModifierPortion,
  deleteModifierPortion,
  checkModifierPortionExists,
  toggleModifierPortionActive,
} from "../models/modifier.model.js";

import {
  ok,
  created,
  badRequest,
  notFound,
  serverError,
  conflict,
} from "../utils/apiResponse.js";

import {
  getCombinationsByPortionId,
  getCombinationsByProductId,
  getCombinationById,
  createCombination,
  updateCombination,
  deleteCombination,
} from "../models/modifier_combination.model.js";

// ============================================================================
// MODIFIER MASTER CONTROLLERS
// ============================================================================

export const getAllModifiersController = async (req, res) => {
  try {
    const modifiers = await getAllModifiers();
    if (!modifiers || modifiers.length === 0) {
      return notFound(res, "No modifiers found");
    }
    return ok(res, "Modifiers fetched successfully", modifiers);
  } catch (err) {
    console.error("Get All modifiers controller error ", err);
    return serverError(res, "Internal server error");
  }
};

export const getModifierByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const modifier = await getModifierById(id);
    if (!modifier) {
      return notFound(res, "Modifier Not found");
    }
    return ok(res, "Modifier fetched successfully", modifier);
  } catch (err) {
    console.error("Get Modifier By Id controller error ", err);
    return serverError(res, "Internal server error");
  }
};

export const createModifierController = async (req, res) => {
  try {
    const { modifier_name, modifier_value, modifier_type, additional_price } = req.body;
    const exists = await checkModifierExists(modifier_name, modifier_value);
    if (exists) {
      return conflict(res, `Modifier "${modifier_name} - ${modifier_value}" already exists`);
    }
    const created_by = req.user.id;
    const modifier_id = await createModifier({
      modifier_name,
      modifier_value,
      modifier_type: modifier_type || null,
      additional_price,
      created_by,
    });
    return created(res, "Modifier created successfully", { modifier_id });
  } catch (err) {
    console.error("Create Modifier Controller error ", err);
    if (err.code === "ER_DUP_ENTRY") {
      return conflict(res, "Modifier with this name and value already exists");
    }
    return serverError(res, "Internal server error");
  }
};

export const updateModifierController = async (req, res) => {
  try {
    const { id } = req.params;
    const { modifier_name, modifier_value, modifier_type, additional_price, is_active } = req.body;
    const updated_by = req.user.id;
    const exixtingModifier = await getModifierById(id);
    if (!exixtingModifier) {
      return notFound(res, "Modifier not found");
    }
    await updateModifier(id, {
      modifier_name,
      modifier_value,
      modifier_type: modifier_type ?? null,
      additional_price,
      is_active,
      updated_by,
    });
    return ok(res, "Modifier updated successfully");
  } catch (err) {
    console.error("Update Modifier Controller error ", err);
    return serverError(res, "Internal server error");
  }
};

export const deleteModifierController = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user.id;
    const existingModifier = await getModifierById(id);
    if (!existingModifier) {
      return notFound(res, "Modifier not found");
    }
    await deleteModifier(id, deleted_by);
    return ok(res, "Modifier deleted successfully");
  } catch (err) {
    console.error("Delete Modifier Controller error ", err);
    return serverError(res, "Internal server error");
  }
};

export const toggleModifierController = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user.id;
    const existingModifier = await getModifierByIdForAdmin(id);
    if (!existingModifier) {
      return notFound(res, "Modifier not found");
    }
    await toggleModifierActive(id, updated_by);
    const newIsActive = !existingModifier.is_active;
    return ok(res, "Modifier status toggled successfully", { is_active: newIsActive });
  } catch (err) {
    console.error("Toggle Modifier Controller error", err);
    return serverError(res, "Internal server error");
  }
};

// ============================================================================
// MODIFIER PORTION CONTROLLERS
// ============================================================================

export const getAllModifierPortionsController = async (req, res) => {
  try {
    const { modifier_id } = req.params;
    const modifierPortions = await getModifierPortions(modifier_id);
    if (!modifierPortions || modifierPortions.length === 0) {
      return notFound(res, "No modifier portions found");
    }
    return ok(res, "Modifier portions fetched successfully", modifierPortions);
  } catch (err) {
    console.error("Get All Modifier Portions Controller error ", err);
    return serverError(res, "Internal server error");
  }
};

export const getModifiersByProductPortionController = async (req, res) => {
  try {
    const { product_portion_id } = req.params;
    const portionExists = await checkProductPortionExists(product_portion_id);
    if (!portionExists) {
      return notFound(res, "Product portion not found");
    }
    const modifiers = await getModifiersByProductPortion(product_portion_id);
    if (modifiers.length === 0) {
      return ok(res, "No modifiers available for this portion", []);
    }
    return ok(res, "Modifiers retrieved successfully", modifiers);
  } catch (err) {
    console.error("Get Modifiers By Product Portion error", err);
    return serverError(res, "Internal server error");
  }
};

export const getModifiersByProductController = async (req, res) => {
  try {
    const { product_id } = req.params;
    const modifiers = await getModifiersByProduct(product_id);
    return ok(res, "Modifiers retrieved successfully", modifiers);
  } catch (err) {
    console.error("Get Modifiers By Product error", err);
    return serverError(res, "Internal server error");
  }
};

export const createModifierPortionController = async (req, res) => {
  try {
    const { modifier_id, product_portion_id, product_id, additional_price, stock } = req.body;
    const modifierExists = await getModifierByIdForAdmin(modifier_id);
    if (!modifierExists) {
      return notFound(res, "Modifier not found");
    }
    if (!product_portion_id && !product_id) {
      return badRequest(res, "Either product_portion_id or product_id is required");
    }
    if (product_portion_id) {
      const portionExists = await checkProductPortionExists(product_portion_id);
      if (!portionExists) {
        return notFound(res, "Product portion not found");
      }
    }
    const created_by = req.user.id;
    const modifier_portion_id = await createModifierPortion({
      modifier_id,
      product_portion_id,
      product_id,
      additional_price,
      stock,
      created_by,
    });
    return created(res, "Modifier portion created successfully", { modifier_portion_id });
  } catch (err) {
    console.error("Create Modifier Portion Controller error ", err);
    if (err.code === "ER_DUP_ENTRY") {
      return conflict(res, "This modifier is already linked to this product portion");
    }
    return serverError(res, "Internal server error");
  }
};

export const updateModifierPortionController = async (req, res) => {
  try {
    const { id } = req.params;
    const { additional_price, stock, is_active } = req.body;
    const updated_by = req.user.id;
    const existingPortion = await getModifierPortionById(id);
    if (!existingPortion) {
      return notFound(res, "Modifier portion not found");
    }
    await updateModifierPortion(id, { additional_price, stock, is_active, updated_by });
    return ok(res, "Modifier portion updated successfully");
  } catch (err) {
    console.error("Update Modifier Portion Controller error ", err);
    return serverError(res, "Internal server error");
  }
};

export const deleteModifierPortionController = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted_by = req.user.id;
    const existingPortion = await getModifierPortionById(id);
    if (!existingPortion) {
      return notFound(res, "Modifier portion not found");
    }
    await deleteModifierPortion(id, deleted_by);
    return ok(res, "Modifier portion deleted successfully");
  } catch (err) {
    console.error("Delete Modifier Portion Controller error ", err);
    return serverError(res, "Internal server error");
  }
};

export const toggleModifierPortionController = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user.id;
    const existingPortion = await getModifierPortionByIdForAdmin(id);
    if (!existingPortion) {
      return notFound(res, "Modifier portion not found");
    }
    await toggleModifierPortionActive(id, updated_by);
    const newIsActive = !existingPortion.is_active;
    return ok(res, "Modifier portion status toggled successfully", { is_active: newIsActive });
  } catch (err) {
    console.error("Toggle Modifier Portion Controller error", err);
    return serverError(res, "Internal server error");
  }
};

// ============================================================================
// MODIFIER COMBINATION CONTROLLERS
// ============================================================================

/** GET /api/modifiers/combinations/by-portion/:product_portion_id */
export const getCombinationsByPortionController = async (req, res) => {
  try {
    const { product_portion_id } = req.params;
    const portionExists = await checkProductPortionExists(product_portion_id);
    if (!portionExists) return notFound(res, "Product portion not found");
    const combos = await getCombinationsByPortionId(product_portion_id);
    return ok(res, "Combinations fetched successfully", combos);
  } catch (err) {
    console.error("getCombinationsByPortionController error", err);
    return serverError(res, "Internal server error");
  }
};

/** GET /api/modifiers/combinations/by-product/:product_id */
export const getCombinationsByProductController = async (req, res) => {
  try {
    const { product_id } = req.params;
    const combos = await getCombinationsByProductId(product_id);
    return ok(res, "Combinations fetched successfully", combos);
  } catch (err) {
    console.error("getCombinationsByProductController error", err);
    return serverError(res, "Internal server error");
  }
};

/** GET /api/modifiers/combinations/:id */
export const getCombinationByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await getCombinationById(id);
    if (!combo) return notFound(res, "Combination not found");
    return ok(res, "Combination fetched successfully", combo);
  } catch (err) {
    console.error("getCombinationByIdController error", err);
    return serverError(res, "Internal server error");
  }
};

/** POST /api/modifiers/combinations */
export const createCombinationController = async (req, res) => {
  try {
    const {
      product_id,
      product_portion_id = null,
      modifier_ids = [],
      additional_price = 0,
      stock = 0,
    } = req.body;

    if (!product_id) return badRequest(res, "product_id is required");
    if (!modifier_ids || modifier_ids.length === 0)
      return badRequest(res, "modifier_ids must be a non-empty array");

    // Validate all modifier_ids exist
    const modDetails = await Promise.all(
      modifier_ids.map((mid) => getModifierByIdForAdmin(mid)),
    );
    const missingIdx = modDetails.findIndex((m) => !m);
    if (missingIdx !== -1)
      return notFound(res, `modifier_id ${modifier_ids[missingIdx]} not found`);

    // Auto-generate name sorted by modifier_type: "Black + 8 GB"
    const name = modDetails
      .slice()
      .sort((a, b) => (a.modifier_type || "").localeCompare(b.modifier_type || ""))
      .map((m) => m.modifier_value)
      .join(" + ");

    if (product_portion_id) {
      const portionExists = await checkProductPortionExists(product_portion_id);
      if (!portionExists) return notFound(res, "Product portion not found");
    }

    const combination_id = await createCombination({
      product_id,
      product_portion_id,
      name,
      additional_price,
      stock,
      modifier_ids,
      created_by: req.user.id,
    });

    return created(res, "Combination created successfully", { combination_id, name });
  } catch (err) {
    console.error("createCombinationController error", err);
    if (err.code === "ER_DUP_ENTRY")
      return conflict(res, "This combination already exists");
    return serverError(res, "Internal server error");
  }
};

/** PUT /api/modifiers/combinations/:id */
export const updateCombinationController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, additional_price, stock, is_active } = req.body;
    const existing = await getCombinationById(id);
    if (!existing || existing.is_deleted) return notFound(res, "Combination not found");
    await updateCombination(id, {
      name,
      additional_price,
      stock,
      is_active,
      updated_by: req.user.id,
    });
    return ok(res, "Combination updated successfully");
  } catch (err) {
    console.error("updateCombinationController error", err);
    return serverError(res, "Internal server error");
  }
};

/** DELETE /api/modifiers/combinations/:id */
export const deleteCombinationController = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getCombinationById(id);
    if (!existing || existing.is_deleted) return notFound(res, "Combination not found");
    await deleteCombination(id, req.user.id);
    return ok(res, "Combination deleted successfully");
  } catch (err) {
    console.error("deleteCombinationController error", err);
    return serverError(res, "Internal server error");
  }
};
