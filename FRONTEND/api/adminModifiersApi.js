/**
 * @module adminModifiersApi
 * @description API layer for admin modifier management.
 *
 * Handles standalone modifier CRUD (modifier_master) and modifier-portion
 * association CRUD (modifier_portion). Supports both portion-level and
 * product-level modifier links.
 *
 * Consumed by AdminModifiersTab and ProductModifiersPanel.
 *
 * Endpoints used:
 *  - GET    /modifiers                    → fetchModifiers
 *  - POST   /modifiers                    → createModifier
 *  - PUT    /modifiers/:id                → updateModifier
 *  - PATCH  /modifiers/:id/toggle         → toggleModifierStatus
 *  - DELETE /modifiers/:id                → deleteModifier
 *  - GET    /modifiers/by-portion/:id     → fetchModifiersByProductPortion
 *  - GET    /modifiers/by-product/:id     → fetchModifiersByProduct
 *  - POST   /modifiers/portions           → createModifierPortion
 *  - PUT    /modifiers/portions/:id       → updateModifierPortion
 *  - DELETE /modifiers/portions/:id       → deleteModifierPortion
 */
import api from "./api";

/**
 * Fetch all modifiers
 * @returns {Promise<Array>}
 */
export const fetchModifiers = async () => {
  const response = await api.get("/modifiers");
  return response.data?.data || [];
};

/**
 * Create a new modifier
 * @param {Object} data - { modifier_name, modifier_value, additional_price, is_active }
 * @returns {Promise<Object>}
 */
export const createModifier = async (data) => {
  const response = await api.post("/modifiers", data);
  return response.data;
};

/**
 * Update an existing modifier
 * @param {number|string} id - Modifier ID
 * @param {Object} data - Updated modifier data
 * @returns {Promise<Object>}
 */
export const updateModifier = async (id, data) => {
  const response = await api.put(`/modifiers/${id}`, data);
  return response.data;
};

/**
 * Toggle modifier active status
 * @param {number|string} id - Modifier ID
 * @returns {Promise<Object>}
 */
export const toggleModifierStatus = async (id) => {
  const response = await api.patch(`/modifiers/${id}/toggle`);
  return response.data;
};

/**
 * Delete a modifier (soft delete)
 * @param {number|string} id - Modifier ID
 * @returns {Promise<Object>}
 */
export const deleteModifier = async (id) => {
  const response = await api.delete(`/modifiers/${id}`);
  return response.data;
};

// ===== Modifier-Portion Associations =====

/**
 * Get all modifiers assigned to a product-portion
 * @param {number|string} productPortionId
 * @returns {Promise<Array>}
 */
export const fetchModifiersByProductPortion = async (productPortionId) => {
  const response = await api.get(`/modifiers/by-portion/${productPortionId}`);
  return response.data?.data || [];
};

/**
 * Get all modifiers assigned directly to a product (no portion)
 * @param {number|string} productId
 * @returns {Promise<Array>}
 */
export const fetchModifiersByProduct = async (productId) => {
  const response = await api.get(`/modifiers/by-product/${productId}`);
  return response.data?.data || [];
};

/**
 * Link a modifier to a product-portion
 * @param {Object} data - { modifier_id, product_portion_id, additional_price?, stock? }
 * @returns {Promise<Object>}
 */
export const createModifierPortion = async (data) => {
  const response = await api.post("/modifiers/portions", data);
  return response.data;
};

/**
 * Update a modifier-portion link
 * @param {number|string} id - modifier_portion_id
 * @param {Object} data - { additional_price?, stock?, is_active? }
 * @returns {Promise<Object>}
 */
export const updateModifierPortion = async (id, data) => {
  const response = await api.put(`/modifiers/portions/${id}`, data);
  return response.data;
};

/**
 * Delete a modifier-portion link
 * @param {number|string} id - modifier_portion_id
 * @returns {Promise<Object>}
 */
export const deleteModifierPortion = async (id) => {
  const response = await api.delete(`/modifiers/portions/${id}`);
  return response.data;
};

// ===== Modifier Combinations =====

export const fetchCombinationsByPortion = async (productPortionId) => {
  const response = await api.get(`/modifiers/combinations/by-portion/${productPortionId}`);
  return response.data?.data || [];
};

export const fetchCombinationsByProduct = async (productId) => {
  const response = await api.get(`/modifiers/combinations/by-product/${productId}`);
  return response.data?.data || [];
};

export const createCombination = async (data) => {
  const response = await api.post("/modifiers/combinations", data);
  return response.data;
};

export const updateCombination = async (id, data) => {
  const response = await api.put(`/modifiers/combinations/${id}`, data);
  return response.data;
};

export const deleteCombination = async (id) => {
  const response = await api.delete(`/modifiers/combinations/${id}`);
  return response.data;
};
