/**
 * @file getRestaurantCtrl.js
 * @module controllers/getRestaurantCtrl
 *
 * @description
 * Handles restaurant search requests by orchestrating input validation, Redis
 * cache lookups, Google Places API fetches, result normalisation, and
 * dining-option post-filtering.
 *
 * **Architectural role:**
 * Sits in the controller layer — contains the request/response lifecycle but
 * delegates validation, external API calls, caching, and data formatting to
 * their respective utilities and services. Contains no raw SQL.
 *
 * **Request pipeline (in order):**
 * 1. Validate query parameters (`restaurantValidator`)
 * 2. Build a ~1 km-grid cache key from rounded coordinates + filters
 * 3. Return cached results immediately if available (Redis TTL: 5 min)
 * 4. Build a Google Places text query from `term` / `category` / `location`
 * 5. Fetch one page (≤ 20 results) from the Places API
 * 6. Normalise raw API response into app-friendly shape (`normalizePlaces`)
 * 7. Post-filter by `diningOption` (dine-in / takeout / delivery)
 * 8. Write results to cache, then send to client
 *
 * **Endpoints served:**
 * | Handler             | Method | Route         | Purpose                    |
 * |---------------------|--------|---------------|----------------------------|
 * | `getAllRestaurants`  | GET    | /restaurants  | Search restaurants by query |
 *
 * **Dependencies:**
 * - `utils/restaurantFormatter`              — normalisation + constant maps
 * - `utils/responseHandler`                  — standardised JSON response helpers
 * - `utils/validators/restaurantValidator`   — query parameter validation
 * - `services/googlePlacesService`           — Google Places API fetch wrapper
 * - `utils/cache`                            — Redis get/set helpers
 *
 * @example <caption>Quick Start — registered route that maps to this controller</caption>
 * ```js
 * import getRestaurantCtrl from '../controllers/getRestaurantCtrl.js';
 *
 * router.get('/restaurants', authMiddleware, getRestaurantCtrl.getAllRestaurants);
 * ```
 */

import { normalizePlaces, PLACES_URL, PRICE_MAP, SORT_MAP } from '../utils/restaurantFormatter.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { validateRestaurantQuery } from '../utils/validators/restaurantValidator.js';
import { fetchGooglePlaces } from '../services/googlePlacesService.js';
import { getCache, setCache } from '../utils/cache.js';

/**
 * Searches for restaurants using the Google Places API, with Redis caching,
 * input validation, result normalisation, and dining-option post-filtering.
 *
 * **Cache key design:** latitude and longitude are rounded to 2 decimal places
 * (~1 km grid) before being included in the key. This means GPS readings from
 * within the same ~1 km square share a single cache entry, dramatically
 * increasing cache hit rates for mobile users walking around a neighbourhood.
 *
 * **Single-page fetch:** only one page (≤ 20 results) is requested from the
 * Places API to cap both latency and per-request API cost. The 20-result limit
 * is enforced by `maxResultCount` in the Places payload.
 *
 * **Dining-option filtering is post-fetch:** the Places API does not support
 * filtering by dine-in/takeout/delivery natively, so the results are filtered
 * after normalisation. This means the actual result count may be lower than 20.
 *
 * **Complexity:** O(n) where n ≤ 20 for normalisation and post-filtering;
 * all other operations are O(1). Total latency is dominated by the Places API
 * network call (~200–800 ms typical) unless the cache is warm (~5 ms).
 *
 * @async
 * @param {import('express').Request}  req - Express request object.
 *   @param {string}  [req.query.latitude]      - Decimal latitude for coordinate-based search.
 *   @param {string}  [req.query.longitude]     - Decimal longitude for coordinate-based search.
 *   @param {string}  [req.query.location]      - City or neighbourhood name for text-based search.
 *   @param {string}  [req.query.price]         - Comma-separated price levels (e.g. `'$,$$'`).
 *   @param {string}  [req.query.category]      - Comma-separated cuisines (e.g. `'italian,sushi'`).
 *   @param {string}  [req.query.radius=5000]   - Search radius in metres; default 5000.
 *   @param {string}  [req.query.sortBy=best_match] - Sort order: `'best_match'` or `'distance'`.
 *   @param {string}  [req.query.term='']       - Freeform search term (overrides category text).
 *   @param {string}  [req.query.diningOption=all] - `'all'`, `'dine-in'`, `'takeout'`, or `'delivery'`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends 200 with an array of normalised restaurant objects on success;
 *   400 on invalid query parameters; 500 on Places API or server error.
 *
 * @throws Will call `sendError(res, ..., 500)` if the Places API call or cache write fails.
 */
const getAllRestaurants = async (req, res) => {
  try {
    const {
      latitude, longitude, location,
      price, category, radius = 5000,
      sortBy = 'best_match', term = '',
      diningOption = 'all',
    } = req.query;

    const { isValid, error } = validateRestaurantQuery(req.query);
    if (!isValid) return sendError(res, error, 400);

    // Round coords to 2 decimal places (~1 km grid) so nearby GPS readings share a cache entry.
    const lat2 = latitude ? parseFloat(latitude).toFixed(2) : null;
    const lng2 = longitude ? parseFloat(longitude).toFixed(2) : null;
    const cacheKey = JSON.stringify({ latitude: lat2, longitude: lng2, location, price, category, radius, sortBy, term, diningOption });

    const cached = await getCache(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const apiKey = process.env.PLACES_API_KEY;

    // Build text query — category may be comma-separated (e.g. "italian,mexican").
    // Multiple categories are joined with " or " so the Places API treats them as alternatives.
    const categoryList = category ? category.split(',').filter(Boolean) : [];
    const categoryText = categoryList.length ? categoryList.join(' or ') + ' restaurants' : 'restaurants';
    const base = term || categoryText;
    const textQuery = location ? `${base} in ${location}` : base;

    const baseBody = { textQuery, maxResultCount: 20 };

    if (latitude && longitude) {
      baseBody.locationBias = {
        circle: {
          center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          radius: parseFloat(radius),
        },
      };
    }

    if (SORT_MAP[sortBy]) baseBody.rankPreference = SORT_MAP[sortBy];
    // Map human-readable price symbols ('$', '$$') to Places API enum values before sending.
    if (price) baseBody.priceLevels = price.split(',').map(p => PRICE_MAP[p]).filter(Boolean);

    // Request only the fields the app actually uses — omitting unused fields
    // reduces payload size and lowers per-request API billing.
    const FIELD_MASK = [
      'places.id', 'places.displayName', 'places.rating',
      'places.userRatingCount', 'places.priceLevel',
      'places.formattedAddress', 'places.shortFormattedAddress',
      'places.location', 'places.photos', 'places.types', 'places.googleMapsUri',
      'places.dineIn', 'places.takeout', 'places.delivery',
      'places.currentOpeningHours',
      'nextPageToken',
    ].join(',');

    let allPlaces = [];
    try {
      // Fetch exactly 1 page to cap API cost and keep initial load latency low.
      allPlaces = await fetchGooglePlaces(PLACES_URL, baseBody, apiKey, FIELD_MASK, 1);
    } catch (apiError) {
      return sendError(res, apiError.message, apiError.status || 500);
    }

    let results = normalizePlaces(allPlaces, process.env.BACKEND_URL);

    // Post-filter by dining option — the Places API has no native filter for this,
    // so we apply it after normalisation. `!== false` retains nulls (unknown = optimistic).
    if (diningOption === 'dine-in') results = results.filter(r => r.dineIn !== false);
    else if (diningOption === 'takeout') results = results.filter(r => r.takeout !== false);
    else if (diningOption === 'delivery') results = results.filter(r => r.delivery !== false);

    // Cache the fully processed results for 5 minutes before returning them.
    await setCache(cacheKey, results, 300);
    sendSuccess(res, results);
  } catch (err) {
    console.error('Server error:', err);
    sendError(res);
  }
};

export default { getAllRestaurants };
