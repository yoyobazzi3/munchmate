import api from "../utils/axiosInstance";

export const getRecommendations = (lat, lng) =>
  api.get("/recommendations", { params: { lat, lng } }).then((res) => res.data.data ?? res.data);
