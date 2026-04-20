import { sendError, sendSuccess } from '../utils/responseHandler.js';
import restaurantRepository from '../repositories/restaurantRepository.js';
import userRepository from '../repositories/userRepository.js';
import { fetchGooglePlaces } from '../services/googlePlacesService.js';
import { normalizePlaces, PLACES_URL, PRICE_MAP } from '../utils/restaurantFormatter.js';

const FIELD_MASK = 'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.shortFormattedAddress,places.location,places.photos,places.types';

const recommendationsCtrl = async (req, res) => {
  const userId = req.user.userId;
  const { lat, lng } = req.query;

  if (!lat || !lng) return sendError(res, 'lat and lng are required', 400);

  try {
    // 1. Get click history to find most-clicked cuisine
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

    // 2. Get user preferences for cuisine and price
    const [prefsRow] = await userRepository.getPreferences(userId);
    const favoriteCuisines = prefsRow?.favorite_cuisines
      ? JSON.parse(prefsRow.favorite_cuisines)
      : [];
    const preferredPrice = prefsRow?.preferred_price_range || '';

    // 3. Build search query — top clicked cuisine takes priority, fall back to first saved cuisine
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

    if (preferredPrice && PRICE_MAP[String(preferredPrice.length)]) {
      body.priceLevels = [PRICE_MAP[String(preferredPrice.length)]];
    }

    // 4. Fetch from Google Places
    const apiKey = process.env.PLACES_API_KEY;
    const places = await fetchGooglePlaces(PLACES_URL, body, apiKey, FIELD_MASK);

    // 5. Exclude recently viewed
    const viewedIds = new Set(clickHistory.map((r) => r.id));
    const filtered = places.filter((p) => !viewedIds.has(p.id)).slice(0, 10);

    const backendUrl = process.env.BACKEND_URL || '';
    const reason = searchCuisine !== 'restaurant' ? searchCuisine : null;
    const results = normalizePlaces(filtered, backendUrl).map(r => ({ ...r, _reason: reason }));
    sendSuccess(res, results);
  } catch (err) {
    console.error('Recommendations error:', err);
    sendError(res, 'Failed to fetch recommendations', 500);
  }
};

export default recommendationsCtrl;
