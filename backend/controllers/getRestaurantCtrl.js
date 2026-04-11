import fetch from "node-fetch";
import NodeCache from "node-cache";
import { normalizePlaces } from "../utils/restaurantFormatter.js";
import { sendError, sendSuccess } from '../utils/responseHandler.js';


// Cache restaurant list results for 5 minutes (300s)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

const PRICE_MAP = {
  "1": "PRICE_LEVEL_INEXPENSIVE",
  "2": "PRICE_LEVEL_MODERATE",
  "3": "PRICE_LEVEL_EXPENSIVE",
  "4": "PRICE_LEVEL_VERY_EXPENSIVE",
};

const SORT_MAP = {
  "rating": "RATING",
  "distance": "DISTANCE",
};

const getAllRestaurants = async (req, res) => {
  try {
    const {
      latitude, longitude, location,
      price, category, radius = 5000,
      sortBy = "best_match", term = "",
      diningOption = "all",
    } = req.query;

    if (!(location || (latitude && longitude))) {
      return sendError(res, "Provide latitude+longitude OR a location string.", 400);
    }

    // Build a cache key from all query params that affect results
    const cacheKey = JSON.stringify({ latitude, longitude, location, price, category, radius, sortBy, term, diningOption });
    const cached = cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const apiKey = process.env.PLACES_API_KEY;

    // Build text query — category may be comma-separated (e.g. "italian,mexican")
    const categoryList = category ? category.split(",").filter(Boolean) : [];
    const categoryText = categoryList.length ? categoryList.join(" or ") + " restaurants" : "restaurants";
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
    if (price) baseBody.priceLevels = price.split(",").map(p => PRICE_MAP[p]).filter(Boolean);

    const FIELD_MASK = [
      "places.id", "places.displayName", "places.rating",
      "places.userRatingCount", "places.priceLevel",
      "places.formattedAddress", "places.shortFormattedAddress",
      "places.location", "places.photos", "places.types", "places.googleMapsUri",
      "places.dineIn", "places.takeout", "places.delivery",
      "nextPageToken",
    ].join(",");

    // Fetch 1 page (20 results) — keeps Places API costs and initial image load low
    let allPlaces = [];
    let pageToken = null;
    const MAX_PAGES = 1;

    for (let page = 0; page < MAX_PAGES; page++) {
      const body = { ...baseBody };
      if (pageToken) body.pageToken = pageToken;

      const response = await fetch(PLACES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (page === 0) {
          console.error("Places API error:", data);
          return sendError(res, "Failed to fetch from Google Places", response.status);
        }
        break;
      }

      allPlaces = allPlaces.concat(data.places || []);
      pageToken = data.nextPageToken || null;
      if (!pageToken) break;
    }

    let results = normalizePlaces(allPlaces, process.env.BACKEND_URL);

    if (diningOption === "dine-in") results = results.filter(r => r.dineIn !== false);
    else if (diningOption === "takeout") results = results.filter(r => r.takeout !== false);
    else if (diningOption === "delivery") results = results.filter(r => r.delivery !== false);

    cache.set(cacheKey, results);
    sendSuccess(res, results);
  } catch (err) {
    console.error("Server error:", err);
    sendError(res);
  }
};

export default { getAllRestaurants };
