/**
 * preferencesService.js — User Preferences API Layer
 *
 * Centralizes all HTTP calls for reading and persisting a user's food
 * preferences (favourite cuisines and preferred price range).
 *
 * Every function:
 *  - Returns the parsed response body (`response.data`) on success
 *  - Lets Axios errors propagate so callers can handle them with try/catch
 */

import api from "../utils/axiosInstance";
import { ENDPOINTS } from "../utils/apiEndpoints";

/**
 * Fetches the current user's saved food preferences.
 *
 * @returns {Promise<Object>} Preferences object from the backend
 * @returns {string[]} .favoriteCuisines  - Array of cuisine label strings
 * @returns {string}   .preferredPriceRange - Price symbol (e.g. "$", "$$")
 */
export const getPreferences = () =>
  api.get(ENDPOINTS.PREFERENCES.GET).then((res) => res.data);

/**
 * Persists updated food preferences for the current user.
 *
 * @param {Object}   prefs                    - Preferences payload to save
 * @param {string[]} prefs.favoriteCuisines   - Selected cuisine label strings
 * @param {string}   prefs.preferredPriceRange - Price symbol (e.g. "$$")
 * @returns {Promise<Object>} Updated preferences object returned by the backend
 */
export const savePreferences = (prefs) =>
  api.put(ENDPOINTS.PREFERENCES.SAVE, prefs).then((res) => res.data);
