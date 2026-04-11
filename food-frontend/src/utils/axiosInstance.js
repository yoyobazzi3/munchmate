/**
 * axiosInstance.js — Centralized Axios HTTP Client
 *
 * This is the SINGLE source of truth for all API calls in the frontend.
 * Every component should import `api` from this file instead of using
 * raw `axios` directly. This gives us:
 *
 *  1. Auto-attached Bearer tokens on every request (request interceptor)
 *  2. Automatic token refresh on 401 errors (response interceptor)
 *  3. Automatic redirect to login if refresh fails
 *  4. One place to change the base URL or auth strategy in the future
 *
 * Usage:
 *   import api from "../utils/axiosInstance";
 *   const { data } = await api.get("/preferences");
 *   const { data } = await api.post("/chatbot/ask", { message });
 */

import axios from "axios";
import { getToken, saveToken, getRefreshToken, clearAllTokens } from "./tokenService";

// Base instance — all requests go to the backend URL defined in the .env
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Automatically attaches the stored JWT token as a Bearer header on every request.
// If no token exists (unauthenticated user), the header is simply not added.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Token refresh state ───────────────────────────────────────────────────────
// Tracks whether a refresh is in progress and queues any concurrent failed requests
// so they are retried after the new token is obtained, rather than triggering
// multiple refresh calls simultaneously.
let isRefreshing = false;
let failedQueue = [];

/**
 * Drains the queue of failed requests after a token refresh attempt.
 * If the refresh succeeded, resolves each queued promise with the new token.
 * If it failed, rejects them all so they surface as errors.
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ── Response interceptor ──────────────────────────────────────────────────────
// Intercepts 401 Unauthorized responses. When a token expires mid-session:
//  - Uses the stored refresh token to silently obtain a new access token
//  - Replays the original failed request with the new token
//  - Redirects to login if no refresh token exists or the refresh itself fails
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // No refresh token available — user must log in again
        clearAllTokens();
        window.location.href = "/auth?mode=login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // A refresh is already in flight — queue this request to retry after
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to get a new access token using the refresh token
        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/auth/refresh`,
          { refreshToken }
        );
        saveToken(data.token);
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear all tokens and send user to login
        processQueue(refreshError, null);
        clearAllTokens();
        window.location.href = "/auth?mode=login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

