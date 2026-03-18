import api from "./api";

export const getProductById = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return response.data?.data || null;
};

export const getProductImages = async (productId) => {
  const response = await api.get(`/productImages/${productId}`);
  return response.data?.data || [];
};

export const getProductPortions = async (productId) => {
  const response = await api.get(`/portion/getProductPortions/${productId}`);
  return response.data?.data || [];
};

export const getModifiersByPortion = async (productPortionId) => {
  const response = await api.get(`/modifiers/by-portion/${productPortionId}`);
  return response.data?.data || [];
};

export const getModifiersByProduct = async (productId) => {
  const response = await api.get(`/modifiers/by-product/${productId}`);
  return response.data?.data || [];
};

export const getReviewSummary = async (productId) => {
  const response = await api.get(`/review/product/${productId}/summary`);
  return response.data?.data || null;
};

export const getReviews = async (
  productId,
  { page = 1, limit = 5, sort = "newest" } = {}
) => {
  const response = await api.get(`/review/product/${productId}`, {
    params: { page, limit, sort },
  });
  return response.data?.data || { items: [], total: 0, total_pages: 1, page, limit };
};

export const toggleReviewHelpful = async (reviewId) => {
  const response = await api.patch(`/review/${reviewId}/helpful`);
  return response.data?.data || null;
};

export const createReview = async ({ product_id, rating, title, review_text, order_id }) => {
  const response = await api.post("/review", {
    product_id,
    rating,
    title,
    review_text,
    order_id,
  });
  return response.data?.data || null;
};

export const getVisibleProductOffers = async (productId) => {
  const response = await api.get(`/offer/product/${productId}/visible`);
  const payload = response.data?.data || {};
  const merged = [
    ...(payload.product_offers || []),
    ...(payload.category_offers || []),
  ];

  // The backend can return the same offer via multiple category mappings.
  return Array.from(
    new Map(merged.map((offer) => [Number(offer.offer_id), offer])).values()
  );
};

export const getCategories = async () => {
  const response = await api.get("/category");
  return response.data?.data?.items || [];
};

export const getRelatedProducts = async ({ categoryId, excludeId, limit = 12 }) => {
  const response = await api.get("/products", {
    params: {
      category_id: categoryId,
      page: 1,
      limit,
      is_active: 1,
    },
  });

  const all = response.data?.data || [];
  return all.filter((item) => Number(item.product_id) !== Number(excludeId));
};

export const getCombinationsByPortion = async (productPortionId) => {
  const response = await api.get(`/modifiers/combinations/by-portion/${productPortionId}`);
  return response.data?.data || [];
};

export const getCombinationsByProduct = async (productId) => {
  const response = await api.get(`/modifiers/combinations/by-product/${productId}`);
  return response.data?.data || [];
};

export const getCart = async () => {
  const response = await api.get("/cart");
  return response.data?.data || null;
};

export const addCartItem = async ({ productId, quantity, portionId, modifierIds, combinationId }) => {
  const payload = {
    productId,
    quantity,
    portionId,
    ...(combinationId ? { combinationId } : modifierIds?.length > 0 ? { modifierIds } : {}),
  };
  const response = await api.post("/cart/items", payload);
  return response.data?.data || null;
};
