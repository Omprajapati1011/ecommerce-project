import api from "./api";

export const fetchAdminOffers = async () => {
  const response = await api.get("/offer");
  return response.data?.data || [];
};

export const createAdminOffer = async (data) => {
  const response = await api.post("/offer/create", data);
  return response.data;
};

export const updateAdminOffer = async (id, data) => {
  const response = await api.patch(`/offer/update/${id}`, data);
  return response.data;
};

export const deleteAdminOffer = async (id) => {
  const response = await api.delete(`/offer/delete/${id}`);
  return response.data;
};

export const updateAdminOfferStatus = async (id, isActive) => {
  const response = await api.patch(`/offer/status/${id}`, {
    is_active: isActive ? 1 : 0,
  });
  return response.data;
};

export const createAdminOfferMapping = async ({ offer_id, product_id, category_id }) => {
  const response = await api.post("/offer/mapping/create", {
    offer_id,
    product_id: product_id ?? null,
    category_id: category_id ?? null,
  });
  return response.data;
};

export const fetchAdminOfferMappingsByOfferId = async (offerId) => {
  const response = await api.get(`/offer/mapping/offer/${offerId}`);
  return response.data?.data || [];
};

export const fetchAdminOfferMappings = async () => {
  const response = await api.get("/offer/mapping");
  return response.data?.data || [];
};

export const updateAdminOfferMapping = async (mappingId, data) => {
  const response = await api.patch(`/offer/mapping/update/${mappingId}`, data);
  return response.data;
};
