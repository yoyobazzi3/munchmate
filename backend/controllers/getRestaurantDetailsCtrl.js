/**
 * @file getRestaurantDetailsCtrl.js
 * @module controllers/getRestaurantDetailsCtrl
 *
 * @description
 * Handles requests for full details on a single restaurant by its Google Places ID.
 *
 * **Architectural role:**
 * Sits in the controller layer — validates the route parameter, checks the Redis
 * cache, fetches from the Google Places API on a miss, normalises the response,
 * writes to cache, and returns the result. Contains no raw SQL.
 *
 * **Request pipeline (in order):**
 * 1. Validate that `id` is present in the route params
 * 2. Check Redis cache — return immediately on a hit (TTL: 15 min)
 * 3. Fetch full place details from Google Places API with a scoped field mask
 * 4. Normalise the raw API response into app-friendly shape (`formatRestaurantDetails`)
 * 5. Write normalised result to cache, then send to client
 *
 * **Cache TTL:** 15 minutes (900 s) — longer than the search cache (5 min) because
 * detail pages are fetched individually and place details change less frequently
 * than search rankings.
 *
 * **Endpoints served:**
 * | Handler                  | Method | Route                  | Purpose                      |
 * |--------------------------|--------|------------------------|------------------------------|
 * | `getRestaurantDetails`   | GET    | /restaurants/:id       | Fetch full details for one place |
 *
 * **Dependencies:**
 * - `utils/restaurantFormatter`    — `formatRestaurantDetails` normalisation
 * - `utils/responseHandler`        — standardised JSON response helpers
 * - `services/googlePlacesService` — Google Places Details API wrapper
 * - `utils/cache`                  — Redis get/set helpers
 *
 * @example <caption>Quick Start — registered route that maps to this controller</caption>
 * ```js
 * import getRestaurantDetailsCtrl from '../controllers/getRestaurantDetailsCtrl.js';
 *
 * router.get('/restaurants/:id', authMiddleware, getRestaurantDetailsCtrl.getRestaurantDetails);
 * ```
 */

import { formatRestaurantDetails } from '../utils/restaurantFormatter.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { fetchGooglePlaceDetails } from '../services/googlePlacesService.js';
import { getCache, setCache } from '../utils/cache.js';

/**
 * Fetches full details for a single restaurant by its Google Places ID, with
 * Redis caching to avoid redundant API calls.
 *
 * **Field mask:** only the fields the detail view actually renders are requested.
 * Omitting unused fields (e.g. `reviews`, `accessibilityOptions`) reduces the
 * Places API response payload and lowers per-request billing costs.
 *
 * **Cache key:** the raw Places ID (`id`) is used directly as the cache key —
 * it is globally unique and stable, so no additional namespacing is needed.
 *
 * **Complexity:** O(1) for all operations — single-key cache lookup, single-place
 * API fetch, and a fixed-field normalisation pass. Total latency is dominated by
 * the Places API network call (~200–800 ms) unless the cache is warm (~5 ms).
 *
 * @async
 * @param {import('express').Request}  req - Express request object.
 *   @param {string} req.params.id - Google Places ID of the restaurant. Required.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends 200 with a normalised restaurant details object on success;
 *   400 if `id` is missing; 500 (or the status code from the Places API) on error.
 *
 * @throws Will call `sendError(res, ..., err.status || 500)` if the Places API call fails.
 */
const getRestaurantDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) return sendError(res, 'Missing restaurant ID', 400);

  const cached = await getCache(id);
  if (cached) return sendSuccess(res, cached);

  try {
    const apiKey = process.env.PLACES_API_KEY;

    // Request only the fields rendered on the detail page — omitting unused fields
    // reduces payload size and lowers per-request API billing.
    const FIELD_MASK = [
      'id', 'displayName', 'rating', 'userRatingCount', 'priceLevel',
      'formattedAddress', 'addressComponents', 'location', 'photos',
      'types', 'googleMapsUri', 'nationalPhoneNumber', 'regularOpeningHours',
      'websiteUri',
    ].join(',');

    const placeData = await fetchGooglePlaceDetails(id, apiKey, FIELD_MASK);
    const result = formatRestaurantDetails(placeData, process.env.BACKEND_URL || '');

    // 15-minute TTL — longer than search results (5 min) because place details
    // change less frequently than search rankings.
    await setCache(id, result, 900);
    sendSuccess(res, result);
  } catch (err) {
    console.error('Error fetching details:', err);
    return sendError(res, err.message || 'Failed to fetch details', err.status || 500);
  }
};

export default { getRestaurantDetails };
