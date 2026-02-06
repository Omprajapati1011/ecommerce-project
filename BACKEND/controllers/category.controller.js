import { count } from "console";
import * as Category from "../models/category.model.js";

export const getAllcategory = async (req, res) => {
  try {
    const [categories] = await Category.getAll();
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const [categories] = await Category.getById(categoryId);
    if (categories.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ success: true, count: categories.length, category: categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const [products] = await Category.getByCategory(categoryId);
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const categoryController = {
  getAllcategory,
  getCategoryById,
  getProductsByCategory,
};
export default categoryController;
