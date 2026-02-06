import express from "express";
import categoryController from "../controllers/category.controller.js";

const router = express.Router();

router.get("/", categoryController.getAllcategory);
router.get("/:id", categoryController.getCategoryById);
router.get("/:id/products", categoryController.getProductsByCategory);

export default router;
