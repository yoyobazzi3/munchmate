/**
 * restaurantService.js — Restaurant & Tracking API Layer
 *
 * Centralizes all HTTP calls related to restaurants and click tracking.
 * Components should import from this module instead of calling `api` directly,
 * so that the request shape and endpoint mapping live in one place.
 *
 * Every function:
 *  - Returns the parsed response body (`response.data`) on success
 *  - Lets Axios errors propagate so callers can handle them with try/catch
 */

import api from "../utils/axiosInstance";
import { ENDPOINTS } from "../utils/apiEndpoints";

/**
 * Fetches a list of restaurants matching the given search parameters.
 *
 * @param {Object} params                - Yelp-compatible query parameters
 * @param {number} [params.latitude]     - Latitude for geo-based search
 * @param {number} [params.longitude]    - Longitude for geo-based search
 * @param {string} [params.location]     - Text-based location (e.g. "New York")
 * @param {string} [params.term]         - Search term (e.g. "pizza")
 * @param {string} [params.category]     - Comma-separated Yelp category aliases
 * @param {string} [params.price]        - Price tier filter (e.g. "1,2")
 * @param {number} [params.radius]       - Search radius in metres (max 40 000)
 * @param {string} [params.sortBy]       - Sort order: "best_match" | "rating" | "distance"
 * @param {string} [params.minRating]    - Minimum rating threshold (client-side filter)
 * @param {number} [params.limit]        - Max number of results to return
 * @returns {Promise<Object[]>} Array of restaurant objects from the Yelp API
 */
export const getRestaurants = (params) =>
  api.get(ENDPOINTS.RESTAURANTS.LIST, { params }).then((res) => res.data);

/**
 * Fetches full details for a single restaurant by its Yelp ID.
 *
 * @param {string} id - Yelp restaurant ID
 * @returns {Promise<Object>} Restaurant detail object (hours, photos, coordinates, etc.)
 */
export const getRestaurantDetails = (id) =>
  api.get(ENDPOINTS.RESTAURANTS.DETAILS(id)).then((res) => res.data);

/**
 * Retrieves the click (view) history for the given user.
 * Used to populate the "Recently Viewed" section on the Restaurants page.
 *
 * @param {string|number} userId - ID of the authenticated user
 * @returns {Promise<Object[]>} Array of recently viewed restaurant objects
 */
export const getClickHistory = (userId) =>
  api.get(ENDPOINTS.TRACKING.HISTORY(userId)).then((res) => res.data);

/**
 * Records a restaurant click/view event for the authenticated user.
 * Called whenever a restaurant detail modal is opened.
 *
 * @param {string} restaurantId - Yelp ID of the restaurant that was viewed
 * @returns {Promise<Object>} Confirmation payload from the backend
 */
export const trackClick = (restaurantId) =>
  api
    .post(ENDPOINTS.TRACKING.CLICK, { restaurant_id: restaurantId })
    .then((res) => res.data);
