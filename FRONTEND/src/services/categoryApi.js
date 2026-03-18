import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/",
  withCredentials: true, // Include cookies for authentication
});

export const getAllProducts = (params = undefined) =>
  params ? API.get("/api/products", { params }) : API.get("/api/products");

export const getAllCategories = () => API.get("/api/category/tree");

export const getCategoryWithChildren = (categoryId) =>
  API.get(`/api/category/${categoryId}`);

export const getProductsByCategory = (categoryId, params = {}) =>
  API.get(`/api/category/${categoryId}/products`, { params });

export const getProductsByCategories = (params = {}) =>
  API.get("/api/category/bulk/products", { params });

export const getProductsByCategoryFilters = (params = {}) =>
  API.post("/api/category/filter/products", params);
/*  */
export const getCategoryProductsPriceRange = (params = {}) =>
  API.post("/api/category/filter/products/price-range", params);

export const searchCategoriesByName = (params = {}) =>
  API.get("/api/category", { params });

export const getProductRatingSummary = (productId) =>
  API.get(`/api/review/product/${productId}/summary`);

export const getProductRatingSummariesBulk = (productIds = []) =>
  API.post("/api/review/product/summary/bulk", { product_ids: productIds });

export const getBestSellers = (limit = 8) =>
  API.get("/api/products/bestsellers", { params: { limit } });
