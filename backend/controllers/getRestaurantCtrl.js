import NodeCache from "node-cache";
import { normalizePlaces, PLACES_URL, PRICE_MAP, SORT_MAP } from "../utils/restaurantFormatter.js";
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { validateRestaurantQuery } from '../utils/validators/restaurantValidator.js';
import { fetchGooglePlaces } from '../services/googlePlacesService.js';

// Cache restaurant list results for 5 minutes (300s)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Controller to fetch all restaurants based on user query.
 * Validates inputs, checks cache, fetches from Google Places API if needed,
 * normalizes the results, and filters by dining options.
 * 
 * @param {Object} req - Express request object containing query parameters.
 * @param {Object} res - Express response object.
 */
const getAllRestaurants = async (req, res) => {
  try {
    const {
      latitude, longitude, location,
      price, category, radius = 5000,
      sortBy = "best_match", term = "",
      diningOption = "all",
    } = req.query;

    // Validate incoming query parameters
    const { isValid, error } = validateRestaurantQuery(req.query);
    if (!isValid) return sendError(res, error, 400);

    // Build a cache key from all query params that affect results
    const cacheKey = JSON.stringify({ latitude, longitude, location, price, category, radius, sortBy, term, diningOption });
    const cached = cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached); // Return cached results if available

    const apiKey = process.env.PLACES_API_KEY;

    // Build text query — category may be comma-separated (e.g. "italian,mexican")
    const categoryList = category ? category.split(",").filter(Boolean) : [];
    const categoryText = categoryList.length ? categoryList.join(" or ") + " restaurants" : "restaurants";
    const base = term || categoryText;
    const textQuery = location ? `${base} in ${location}` : base;

    // Prepare the base payload for Google Places API
    const baseBody = { textQuery, maxResultCount: 20 };

    // Apply location bias if coordinates are provided
    if (latitude && longitude) {
      baseBody.locationBias = {
        circle: {
          center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          radius: parseFloat(radius),
        },
      };
    }

    // Apply sorting and pricing filters
    if (SORT_MAP[sortBy]) baseBody.rankPreference = SORT_MAP[sortBy];
    if (price) baseBody.priceLevels = price.split(",").map(p => PRICE_MAP[p]).filter(Boolean);

    // Specify the exact fields needed to reduce payload size and API costs
    const FIELD_MASK = [
      "places.id", "places.displayName", "places.rating",
      "places.userRatingCount", "places.priceLevel",
      "places.formattedAddress", "places.shortFormattedAddress",
      "places.location", "places.photos", "places.types", "places.googleMapsUri",
      "places.dineIn", "places.takeout", "places.delivery",
      "nextPageToken",
    ].join(",");

    let allPlaces = [];
    try {
      // Fetch 1 page (20 results) max to keep API costs and initial load time low
      allPlaces = await fetchGooglePlaces(PLACES_URL, baseBody, apiKey, FIELD_MASK, 1);
    } catch (apiError) {
      return sendError(res, apiError.message, apiError.status || 500);
    }

    // Normalize raw Google Places data into app-friendly format
    let results = normalizePlaces(allPlaces, process.env.BACKEND_URL);

    // Post-filter the formatted results by the user's selected dining option
    if (diningOption === "dine-in") results = results.filter(r => r.dineIn !== false);
    else if (diningOption === "takeout") results = results.filter(r => r.takeout !== false);
    else if (diningOption === "delivery") results = results.filter(r => r.delivery !== false);

    // Cache the fully processed results before turning them to the client
    cache.set(cacheKey, results);
    sendSuccess(res, results);
  } catch (err) {
    console.error("Server error:", err);
    sendError(res);
  }
};

export default { getAllRestaurants };
