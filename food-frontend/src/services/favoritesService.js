import api from "../utils/axiosInstance";

export const getFavorites = () =>
  api.get("/favorites").then((res) => res.data.data ?? res.data);

export const addFavorite = (restaurantId) =>
  api.post("/favorites", { restaurant_id: restaurantId }).then((res) => res.data);

export const removeFavorite = (restaurantId) =>
  api.delete(`/favorites/${restaurantId}`).then((res) => res.data);

export const updateFavorite = (restaurantId, { note, status }) =>
  api.patch(`/favorites/${restaurantId}`, { note, status }).then((res) => res.data);
