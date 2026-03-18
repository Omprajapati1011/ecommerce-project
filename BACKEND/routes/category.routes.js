import express from "express";
import categoryController from "../controllers/category.controller.js";
// import isAdmin from "../middlewares/admin.middleware.js";
// import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/categoryvalidate.middleware.js";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";

import {
  idParamSchema,
  searchQuerySchema,
  multiCategoryQuerySchema,
  multiCategoryProductsQuerySchema,
  categoryProductFilterQuerySchema,
  categoryProductFilterBodySchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation.js";

const router = express.Router();

/*
==============================
PUBLIC
==============================
*/

router.get(
  "/",
  validate(searchQuerySchema, "query"),
  categoryController.getAllcategory,
);

router.get(
  "/bulk",
  validate(multiCategoryQuerySchema, "query"),
  categoryController.getCategoriesByIds,
);

router.get(
  "/bulk/products",
  validate(multiCategoryProductsQuerySchema, "query"),
  categoryController.getProductsByCategories,
);

router.get(
  "/filter/products",
  validate(categoryProductFilterQuerySchema, "query"),
  categoryController.getProductsByCategoryFilters,
);

router.get(
  "/filter/products/price-range",
  validate(categoryProductFilterQuerySchema, "query"),
  categoryController.getProductsPriceRangeByFilters,
);

router.post(
  "/filter/products",
  validate(categoryProductFilterBodySchema, "body"),
  categoryController.getProductsByCategoryFilters,
);

router.post(
  "/filter/products/price-range",
  validate(categoryProductFilterBodySchema, "body"),
  categoryController.getProductsPriceRangeByFilters,
);

router.get("/tree", categoryController.getCategoryTree);


router.get(
  "/:id",
  validate(idParamSchema, "params"),
  categoryController.getCategoryById,
);

router.get(
  "/:id/products",
  validate(idParamSchema, "params"),
  categoryController.getProductsByCategory,
);

/*
==============================
ADMIN
==============================
*/

router.post(
  "/create",
  auth,
  adminOnly,
  validate(createCategorySchema),
  categoryController.createCategory,
);

router.put(
  "/:id",
  auth,
  adminOnly,
  validate(idParamSchema, "params"),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

router.delete(
  "/:id",
  auth,
  adminOnly,
  validate(idParamSchema, "params"),
  categoryController.deleteCategory,
);

router.patch(
  "/:id/restore",
  auth,
  adminOnly,
  validate(idParamSchema, "params"),
  categoryController.restoreCategory,
);

router.patch(
  "/:id/status",
  auth,
  adminOnly,
  validate(idParamSchema, "params"),
  categoryController.updateCategoryStatus,
);

export default router;
