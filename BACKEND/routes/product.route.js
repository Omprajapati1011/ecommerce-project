import express from "express";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  updateProductStatus,
  getAllProducts,
  getProductById
} from "../controllers/product.controller.js";


const router = express.Router();

/* =========================
  Admin protected routes
========================= */
// Post products
router.post('/products',createProduct);
// Delete produts
router.delete("/products/:id", deleteProduct);
// Update Product
// router.put('/products/:id', auth, productController.updateProduct); //auth error to be solve
router.put('/products/:id', updateProduct); //auth error to be solve
// Update Product status
// router.patch('/products/:id/status', auth, productController.updateProductStatus);
router.patch('/products/:id/status', updateProductStatus);

/* =========================
  Public routes
========================= */
router.get('/products/', getAllProducts);
router.get('/products/:id', getProductById);

export default router;