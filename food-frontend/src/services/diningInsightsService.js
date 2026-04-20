import api from "../utils/axiosInstance";

export const getDiningInsights = () =>
  api.get("/dining-insights").then((res) => res.data.data ?? res.data);
