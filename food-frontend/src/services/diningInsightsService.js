import api from "../utils/axiosInstance";

export const getDiningInsights = () =>
  api.get("/dining-insights").then((res) => res.data.data ?? res.data);

export const getSpendingInsights = () =>
  api.get("/dining-insights/spending").then((res) => res.data.data ?? res.data);
