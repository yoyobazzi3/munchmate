import api from "../utils/axiosInstance";

export const getFavorites = () =>
  api.get("/favorites").then((res) => res.data.data ?? res.data);

export const addFavorite = (restaurantId) =>
  api.post("/favorites", { restaurant_id: restaurantId }).then((res) => res.data);

export const removeFavorite = (restaurantId) =>
  api.delete(`/favorites/${restaurantId}`).then((res) => res.data);

export const updateFavorite = (restaurantId, { note, status, rating }) =>
  api.patch(`/favorites/${restaurantId}`, { note, status, rating }).then((res) => res.data);

export const updateSpend = (restaurantId, amount) =>
  api.patch(`/favorites/${restaurantId}/spend`, { amount }).then((res) => res.data);

export const getSpendLogs = (restaurantId) =>
  api.get(`/favorites/${restaurantId}/spend`).then((res) => res.data.data ?? res.data);

export const getVisitedSummary = () =>
  api.get("/favorites/visited-summary").then((res) => res.data.data ?? res.data);

export const getTasteProfile = () =>
  api.get("/taste-profile").then((res) => res.data.data ?? res.data);
