/**
 * axiosInstance.js — Centralized Axios HTTP Client
 *
 * This is the SINGLE source of truth for all API calls in the frontend.
 * Every component should import `api` from this file instead of using
 * raw `axios` directly. This gives us:
 *
 *  1. Automatic cookie attachment on every request (withCredentials: true)
 *  2. Automatic token refresh on 401 errors (response interceptor)
 *  3. Automatic redirect to login if refresh fails
 *  4. One place to change the base URL or auth strategy in the future
 *
 * Tokens are stored in HttpOnly cookies set by the backend — they are never
 * accessible to JavaScript and are attached to requests automatically by
 * the browser when withCredentials is true.
 *
 * Usage:
 *   import api from "../utils/axiosInstance";
 *   const { data } = await api.get("/preferences");
 *   const { data } = await api.post("/chatbot/ask", { message });
 */

import axios from "axios";
import { clearUser } from "./tokenService";

// Base instance — withCredentials ensures cookies are sent on every request
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

// ── Token refresh state ───────────────────────────────────────────────────────
// Tracks whether a refresh is in progress and queues any concurrent failed requests
// so they are retried after the new token is obtained, rather than triggering
// multiple refresh calls simultaneously.
let isRefreshing = false;
let failedQueue = [];

/**
 * Drains the queue of failed requests after a token refresh attempt.
 * If the refresh succeeded, resolves each queued promise so they retry.
 * If it failed, rejects them all so they surface as errors.
 */
const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

// ── Response interceptor ──────────────────────────────────────────────────────
// Intercepts 401 Unauthorized responses. When the access token cookie expires mid-session:
//  - POSTs to /auth/refresh — the browser sends the refreshToken cookie automatically
//  - The backend sets a new accessToken cookie in its response
//  - Replays the original failed request (which now has the fresh cookie)
//  - Redirects to login if the refresh token is also expired or missing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // A refresh is already in flight — queue this request to retry after
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // No body needed — the refreshToken cookie is sent automatically
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token also expired — clear user info and send to login
        processQueue(refreshError);
        clearUser();
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
