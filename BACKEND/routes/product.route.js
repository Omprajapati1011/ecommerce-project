import express from "express";
import {createProduct, deleteProduct } from "../controllers/product.controller.js";

const router = express.Router();

// Post products
router.post('/products',createProduct);
// Delete produts
router.delete("/products/:id", deleteProduct);

export default router;