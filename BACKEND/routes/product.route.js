import express from "express";
import {createProduct} from "../controllers/product.controller.js";

const router = express.Router();

// Post products
router.post('/products',createProduct);

export default router;