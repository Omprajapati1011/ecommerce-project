import express from "express";
import categoryController from "../controllers/category.controller.js";
// import isAdmin from "../middlewares/admin.middleware.js";
// import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/categoryvalidate.middleware.js";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";

import {
  idParamSchema,
  searchQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation.js";

const router = express.Router();

/*
==============================
PUBLIC
==============================
*/

router.get("/", categoryController.getAllcategory);

router.get(
  "/search",
  validate(searchQuerySchema, "query"),
  categoryController.searchCategory,
);

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

export default router;
