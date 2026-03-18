/**
 * @module adminCategoriesApi
 * @description API layer for admin category management.
 *
 * Wraps axios calls to the category endpoints.
 * Consumed by AdminCategoriesTab on the admin dashboard.
 *
 * Endpoints used:
 *  - GET    /category          → fetchAllCategories (full flat list, active only)
 *  - POST   /category/create   → createCategory
 *  - PUT    /category/:id      → updateCategory
 *  - DELETE /category/:id      → deleteCategory (soft-deletes full subtree)
 *  - PATCH  /category/:id/restore → restoreCategory (restores full subtree)
 *
 * Uses the shared `api` axios instance (with baseURL and auth interceptors).
 */
import api from "./api";

/**
 * Fetch all active categories (flat list, no pagination).
 * @returns {Promise<Array>} Array of category objects
 */
export const fetchAllCategories = async () => {
  const response = await api.get("/category");
  const data = response.data?.data;
  return data?.items || data || [];
};

/**
 * Create a new category.
 * @param {{ name: string, parent_id?: number|null }} data
 * @returns {Promise<Object>}
 */
export const createCategory = async (data) => {
  const response = await api.post("/category/create", data);
  return response.data;
};

/**
 * Update an existing category.
 * @param {number|string} id - Category ID
 * @param {{ name?: string, parent_id?: number|null }} data
 * @returns {Promise<Object>}
 */
export const updateCategory = async (id, data) => {
  const response = await api.put(`/category/${id}`, data);
  return response.data;
};

/**
 * Soft-delete a category and its entire subtree.
 * @param {number|string} id - Category ID
 * @returns {Promise<Object>}
 */
export const deleteCategory = async (id) => {
  const response = await api.delete(`/category/${id}`);
  return response.data;
};

/**
 * Restore a soft-deleted category and its entire subtree.
 * @param {number|string} id - Category ID
 * @returns {Promise<Object>}
 */
export const restoreCategory = async (id) => {
  const response = await api.patch(`/category/${id}/restore`);
  return response.data;
};

/**
 * Toggle category active status. When deactivating a parent category,
 * the backend will cascade deactivation to all child categories.
 * @param {number|string} id - Category ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>}
 */
export const updateCategoryStatus = async (id, isActive) => {
  const response = await api.patch(`/category/${id}/status`, {
    is_active: isActive ? 1 : 0,
  });
  return response.data;
};
