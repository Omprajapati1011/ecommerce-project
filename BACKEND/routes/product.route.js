import express from "express";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  updateProductStatus,
  getAllProducts,
  getProductById,
  getBestSellers,
} from "../controllers/product.controller.js";
import { validate } from "../middlewares/Validations.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/product.validation.js";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Admin protected routes
router.post("/", auth, adminOnly, validate(createProductSchema), createProduct);
router.delete("/:id", auth, adminOnly, deleteProduct);
router.put(
  "/:id",
  auth,
  adminOnly,
  validate(updateProductSchema),
  updateProduct,
);
router.patch("/:id/status", auth, adminOnly, updateProductStatus);

// Public routes
router.get("/bestsellers", getBestSellers);
router.get("/", getAllProducts);
router.get("/:id", getProductById);

export default router;
