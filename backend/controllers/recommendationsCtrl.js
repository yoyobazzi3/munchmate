/**
 * @file recommendationsCtrl.js
 * @module controllers/recommendationsCtrl
 *
 * @description
 * Generates personalised restaurant recommendations for the authenticated user
 * by combining click history, saved preferences, and low-rated favorites to
 * produce a ranked, filtered list of nearby restaurants.
 *
 * **Architectural role:**
 * Sits in the controller layer — orchestrates data gathering from multiple
 * repositories, builds a Google Places query from the aggregated signals, and
 * post-filters the results. Contains no raw SQL.
 *
 * **Recommendation pipeline (in order):**
 * 1. Check Redis cache — return immediately on a hit (TTL: 10 min)
 * 2. Analyse click history to find the most-clicked cuisine
 * 3. Fetch saved preferences (favourite cuisines + preferred price range)
 * 4. Fetch low-rated favorites (≤ 2 stars) to build a disliked-cuisine exclusion set
 * 5. Build a Google Places text query — click-derived cuisine takes priority over saved preferences
 * 6. Fetch up to 20 candidates from the Places API
 * 7. Post-filter: remove already-viewed places and disliked-cuisine matches; cap at 10 results
 * 8. Attach `_reason` label, write to cache, return to client
 *
 * **Personalisation signal priority:**
 * `topClickedCuisine` > `favoriteCuisines[0]` > generic `'restaurant'`
 *
 * Click history is the strongest signal because it reflects actual behaviour,
 * not stated preferences which may be stale or aspirational.
 *
 * **Endpoints served:**
 * | Handler                  | Method | Route              | Purpose                         |
 * |--------------------------|--------|--------------------|---------------------------------|
 * | `recommendationsCtrl`    | GET    | /recommendations   | Personalised restaurant list    |
 *
 * **Dependencies:**
 * - `repositories/restaurantRepository`  — click history reads
 * - `repositories/userRepository`        — preference reads
 * - `repositories/favoritesRepository`   — rated favorites reads
 * - `services/googlePlacesService`       — Places API search fetch
 * - `utils/restaurantFormatter`          — normalisation + constant maps
 * - `utils/cache`                        — Redis get/set helpers
 * - `utils/responseHandler`              — standardised JSON response helpers
 *
 * @example <caption>Quick Start — registered route that maps to this controller</caption>
 * ```js
 * import recommendationsCtrl from '../controllers/recommendationsCtrl.js';
 *
 * router.get('/recommendations', authMiddleware, recommendationsCtrl);
 * ```
 */

import { sendError, sendSuccess } from '../utils/responseHandler.js';
import restaurantRepository from '../repositories/restaurantRepository.js';
import userRepository from '../repositories/userRepository.js';
import favoritesRepository from '../repositories/favoritesRepository.js';
import { fetchGooglePlaces } from '../services/googlePlacesService.js';
import { normalizePlaces, PLACES_URL, PRICE_MAP } from '../utils/restaurantFormatter.js';
import { getCache, setCache } from '../utils/cache.js';

// Scoped field mask — only fields rendered on the recommendations card are requested
// to reduce Places API payload size and per-request billing cost.
const FIELD_MASK = 'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.shortFormattedAddress,places.location,places.photos,places.types';

/**
 * Returns up to 10 personalised restaurant recommendations for the authenticated
 * user based on click history, saved preferences, and low-rating exclusions.
 *
 * **Cache key:** `recs:<userId>` — scoped per user, 10-minute TTL. Longer than
 * the search cache (5 min) because recommendations are computationally heavier
 * (3 DB reads + 1 API call) and change less frequently than a manual search.
 *
 * **Disliked-cuisine exclusion:** any restaurant category where the user has
 * saved a favorite with a personal rating ≤ 2 is added to a `Set` and filtered
 * out of the Places results. This avoids recommending cuisines the user has
 * explicitly rated poorly, even if they are nearby and popular.
 *
 * **`_reason` field:** set to the cuisine that drove the query (e.g. `'italian'`)
 * so the frontend can display "Because you like Italian" labels. `null` when the
 * query fell back to the generic `'restaurant'` term.
 *
 * **Complexity:** O(c + p + f + n) where c = click history rows, p = preference
 * parse (bounded), f = rated favorites rows, n ≤ 20 for the filter/normalise pass.
 * Total latency is dominated by the Places API network call (~200–800 ms) unless
 * the cache is warm (~5 ms).
 *
 * @async
 * @param {import('express').Request}  req - Express request object.
 *   @param {string} req.query.lat   - Decimal latitude for the location bias. Required.
 *   @param {string} req.query.lng   - Decimal longitude for the location bias. Required.
 *   @param {Object} req.user        - Populated by auth middleware.
 *   @param {number} req.user.userId - The authenticated user's primary key.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends 200 with an array of up to 10 normalised restaurant
 *   objects, each augmented with a `_reason` string (or `null`), on success;
 *   400 if `lat` or `lng` is missing; 500 on any unexpected error.
 *
 * @throws Will call `sendError(res, ..., 500)` if any repository query or the
 *   Places API call fails.
 */
const recommendationsCtrl = async (req, res) => {
  const userId = req.user.userId;
  const { lat, lng } = req.query;

  if (!lat || !lng) return sendError(res, 'lat and lng are required', 400);

  // Per-user cache key — recommendations are personal and must not be shared across users.
  const cacheKey = `recs:${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return sendSuccess(res, cached);

  try {
    // Step 1: Derive the most-clicked cuisine from click history.
    // Click behaviour is the strongest personalisation signal — it reflects actual
    // intent, not just stated preferences which may be aspirational or stale.
    const clickHistory = await restaurantRepository.getClickHistory(userId);
    const categoryCount = {};
    clickHistory.forEach((r) => {
      if (r.category) {
        const key = r.category.toLowerCase();
        categoryCount[key] = (categoryCount[key] || 0) + 1;
      }
    });
    const topClickedCuisine = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Step 2: Fetch saved preferences — cuisines and price range.
    const [prefsRow] = await userRepository.getPreferences(userId);
    let favoriteCuisines = [];
    try {
      if (prefsRow?.favorite_cuisines) {
        favoriteCuisines = JSON.parse(prefsRow.favorite_cuisines);
      }
    } catch {
      // Malformed JSON in the DB — treat as no saved cuisines rather than crashing.
      favoriteCuisines = [];
    }
    const preferredPrice = prefsRow?.preferred_price_range || '';

    // Step 3: Build a disliked-cuisine exclusion set from low-rated favorites (≤ 2 stars).
    // Avoids recommending cuisines the user has explicitly rated poorly.
    const ratedFavorites = await favoritesRepository.getRatedFavorites(userId);
    const dislikedCategories = new Set(
      ratedFavorites
        .filter(r => r.rating <= 2 && r.category)
        .map(r => r.category.toLowerCase())
    );

    // Step 4: Choose the search cuisine — click-derived takes priority over saved preferences.
    const searchCuisine = topClickedCuisine
      || favoriteCuisines[0]?.toLowerCase()
      || 'restaurant';

    const body = {
      textQuery: `${searchCuisine} restaurant`,
      locationBias: {
        circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: 5000 },
      },
      maxResultCount: 20,
    };

    // Map the price range symbol length ('$' = 1, '$$' = 2, etc.) to the Places API enum.
    if (preferredPrice && PRICE_MAP[String(preferredPrice.length)]) {
      body.priceLevels = [PRICE_MAP[String(preferredPrice.length)]];
    }

    // Step 5: Fetch candidates from Places API.
    const apiKey = process.env.PLACES_API_KEY;
    const places = await fetchGooglePlaces(PLACES_URL, body, apiKey, FIELD_MASK);

    // Step 6: Post-filter — remove already-viewed places and disliked-cuisine matches.
    // Cap at 10 to keep the recommendations panel concise.
    const viewedIds = new Set(clickHistory.map((r) => r.id));
    const filtered = places
      .filter((p) => !viewedIds.has(p.id))
      .filter((p) => {
        if (!dislikedCategories.size) return true;
        const pCategory = (p.types?.[0] || '').replace(/_/g, ' ').toLowerCase();
        return !dislikedCategories.has(pCategory);
      })
      .slice(0, 10);

    const backendUrl = process.env.BACKEND_URL || '';
    // _reason drives "Because you like X" UI labels; null when the query used the generic fallback.
    const reason = searchCuisine !== 'restaurant' ? searchCuisine : null;
    const results = normalizePlaces(filtered, backendUrl).map(r => ({ ...r, _reason: reason }));

    // 10-minute TTL — longer than search (5 min) because recommendations are
    // computationally heavier (3 DB reads + 1 API call) and change infrequently.
    await setCache(cacheKey, results, 600);
    sendSuccess(res, results);
  } catch (err) {
    console.error('Recommendations error:', err);
    sendError(res, 'Failed to fetch recommendations', 500);
  }
};

export default recommendationsCtrl;
