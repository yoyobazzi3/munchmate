/**
 * apiEndpoints.js — Centralized API Endpoint Constants
 *
 * All backend route strings are defined here. Components and services should
 * import from this file rather than hardcoding strings, so a backend route
 * rename only requires a single change.
 *
 * These paths are relative to the baseURL configured in axiosInstance.js and
 * should be passed directly to api.get / api.post etc.
 *
 * Usage:
 *   import { ENDPOINTS } from "../utils/apiEndpoints";
 *   api.get(ENDPOINTS.RESTAURANTS.LIST, { params: filters });
 *   api.get(ENDPOINTS.RESTAURANTS.DETAILS(id));
 *   api.post(ENDPOINTS.AUTH.LOGIN, credentials);
 */

export const ENDPOINTS = {

  // ── Restaurants ─────────────────────────────────────────────────────────────

  RESTAURANTS: {
    /** GET — fetch a paginated/filtered list of restaurants */
    LIST: "/getRestaurants",

    /**
     * GET — fetch full details for a single restaurant.
     * @param {string} id - The restaurant's unique identifier
     */
    DETAILS: (id) => `/getRestaurantDetails/${id}`,
  },

  // ── User preferences ─────────────────────────────────────────────────────────

  PREFERENCES: {
    /** GET — load the authenticated user's saved preferences */
    GET: "/preferences",

    /** PUT — save updated preferences for the authenticated user */
    SAVE: "/preferences",
  },

  // ── Click / recommendation tracking ──────────────────────────────────────────

  TRACKING: {
    /**
     * GET — fetch a user's restaurant click history for recommendations.
     * @param {string} userId - The user's ID
     */
    HISTORY: (userId) => `/clickHistory/${userId}`,

    /** POST — record a restaurant click for the recommendation engine */
    CLICK: "/trackClick",
  },

  // ── Chatbot ──────────────────────────────────────────────────────────────────

  CHATBOT: {
    /** GET — fetch the authenticated user's chat message history */
    HISTORY: "/chatbot/history",

    /** POST — send a message and receive an AI response */
    ASK: "/chatbot/ask",

    /** DELETE — clear the authenticated user's chat history */
    CLEAR: "/chatbot/clear",
  },

  // ── Authentication ────────────────────────────────────────────────────────────

  AUTH: {
    /** POST — log in with email and password */
    LOGIN: "/login",

    /** POST — create a new account */
    SIGNUP: "/signup",

    /** POST — log out and invalidate the current session */
    LOGOUT: "/logout",

    /** GET — verify the current session / access token is still valid */
    VERIFY: "/auth/verify",

    /** POST — exchange a valid refresh token cookie for a new access token */
    REFRESH: "/auth/refresh",

    /** POST — send a password-reset code to the provided email address */
    FORGOT_PASSWORD: "/auth/forgot-password",

    /** POST — complete a password reset using the emailed code */
    RESET_PASSWORD: "/auth/reset-password",
  },

  // ── Geocoding ─────────────────────────────────────────────────────────────────

  GEO: {
    /** GET — convert lat/lon coordinates to a human-readable location name */
    REVERSE_GEOCODE: "/reverse-geocode",
  },
};
