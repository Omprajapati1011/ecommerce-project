// Modifier Routes - API endpoints for modifier operations

import express from "express";
import { validate } from "../middlewares/Validations.middleware.js";

// Import validation schemas
import {
  createModifierSchema,
  updateModifierSchema,
  // patchModifierSchema,
  createModifierPortionSchema,
  updateModifierPortionSchema,
  // patchModifierPortionSchema,
} from "../validations/modifier.validation.js";

// Import controllers
import {
  getAllModifiersController,
  getModifierByIdController,
  createModifierController,
  updateModifierController,
  deleteModifierController,
  toggleModifierController,
  getAllModifierPortionsController,
  getModifiersByProductPortionController,
  getModifiersByProductController,
  createModifierPortionController,
  updateModifierPortionController,
  deleteModifierPortionController,
  toggleModifierPortionController,
} from "../controllers/modifier.controller.js";

// Import middlewares
import { auth, adminOnly } from "../middlewares/auth.middleware.js";

const modifierRouter = express.Router();

// ============================================================================
// MODIFIER MASTER ROUTES
// ============================================================================

// GET /api/modifiers - Get all modifiers
modifierRouter.get("/", getAllModifiersController);

// GET /api/modifiers/:id - Get single modifier
modifierRouter.get("/:id", getModifierByIdController);

// POST /api/modifiers - Create new modifier
modifierRouter.post(
  "/",
  auth,
  adminOnly,
  validate(createModifierSchema),
  createModifierController,
);

// PUT /api/modifiers/:id - Update modifier
modifierRouter.put(
  "/:id",
  auth,
  adminOnly,
  validate(updateModifierSchema),
  updateModifierController,
);

// DELETE /api/modifiers/:id - Delete modifier
modifierRouter.delete("/:id", auth, adminOnly, deleteModifierController);

// PATCH /api/modifiers/:id/toggle - Toggle active status (Admin only)
modifierRouter.patch("/:id/toggle", auth, adminOnly, toggleModifierController);

// // PATCH /api/modifiers/:id - Partial update modifier (Admin only)
// modifierRouter.patch(
//   "/:id",
//   auth,
//   adminOnly,
//   validate(patchModifierSchema),
//   patchModifierController,
// );

// ============================================================================
// MODIFIER PORTION ROUTES
// ============================================================================

// GET /api/modifiers/:modifier_id/portions - Get portions for a modifier
modifierRouter.get(
  "/:modifier_id/portions",
  auth,
  adminOnly,
  getAllModifierPortionsController,
);

// POST /api/modifiers/portions - Link modifier to portion
modifierRouter.post(
  "/portions",
  auth,
  adminOnly,
  validate(createModifierPortionSchema),
  createModifierPortionController,
);

// GET /api/modifiers/by-portion/:product_portion_id - Get all modifiers for a portion (Public)
modifierRouter.get(
  "/by-portion/:product_portion_id",
  getModifiersByProductPortionController,
);

// GET /api/modifiers/by-product/:product_id - Get modifiers linked directly to a product (no portion)
modifierRouter.get(
  "/by-product/:product_id",
  getModifiersByProductController,
);

// PUT /api/modifiers/portions/:id - Update modifier portion
modifierRouter.put(
  "/portions/:id",
  auth,
  adminOnly,
  validate(updateModifierPortionSchema),
  updateModifierPortionController,
);

// DELETE /api/modifiers/portions/:id - Delete modifier portion
modifierRouter.delete(
  "/portions/:id",
  auth,
  adminOnly,
  deleteModifierPortionController,
);

// PATCH /api/modifiers/portions/:id/toggle - Toggle portion active status (Admin only)
modifierRouter.patch(
  "/portions/:id/toggle",
  auth,
  adminOnly,
  toggleModifierPortionController,
);

// // PATCH /api/modifiers/portions/:id - Partial update portion (Admin only)
// modifierRouter.patch(
//   "/portions/:id",
//   auth,
//   adminOnly,
//   validate(patchModifierPortionSchema),
//   patchModifierPortionController,
// );

import {
  getCombinationsByPortionController,
  getCombinationsByProductController,
  getCombinationByIdController,
  createCombinationController,
  updateCombinationController,
  deleteCombinationController,
} from "../controllers/modifier.controller.js";

// ============================================================================
// MODIFIER COMBINATION ROUTES
// ============================================================================

// GET /api/modifiers/combinations/by-portion/:product_portion_id (Public)
modifierRouter.get(
  "/combinations/by-portion/:product_portion_id",
  getCombinationsByPortionController,
);

// GET /api/modifiers/combinations/by-product/:product_id (Public)
modifierRouter.get(
  "/combinations/by-product/:product_id",
  getCombinationsByProductController,
);

// GET /api/modifiers/combinations/:id (Public)
modifierRouter.get("/combinations/:id", getCombinationByIdController);

// POST /api/modifiers/combinations (Admin only)
modifierRouter.post(
  "/combinations",
  auth,
  adminOnly,
  createCombinationController,
);

// PUT /api/modifiers/combinations/:id (Admin only)
modifierRouter.put(
  "/combinations/:id",
  auth,
  adminOnly,
  updateCombinationController,
);

// DELETE /api/modifiers/combinations/:id (Admin only)
modifierRouter.delete(
  "/combinations/:id",
  auth,
  adminOnly,
  deleteCombinationController,
);

export default modifierRouter;
