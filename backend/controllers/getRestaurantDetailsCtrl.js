import { formatRestaurantDetails } from "../utils/restaurantFormatter.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import { fetchGooglePlaceDetails } from "../services/googlePlacesService.js";
import { getCache, setCache } from "../utils/cache.js";

const getRestaurantDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) return sendError(res, "Missing restaurant ID", 400);

  const cached = await getCache(id);
  if (cached) return sendSuccess(res, cached);

  try {
    const apiKey = process.env.PLACES_API_KEY;

    const FIELD_MASK = [
      "id", "displayName", "rating", "userRatingCount", "priceLevel",
      "formattedAddress", "addressComponents", "location", "photos",
      "types", "googleMapsUri", "nationalPhoneNumber", "regularOpeningHours",
      "websiteUri",
    ].join(",");

    const placeData = await fetchGooglePlaceDetails(id, apiKey, FIELD_MASK);
    const result = formatRestaurantDetails(placeData, process.env.BACKEND_URL || '');

    await setCache(id, result, 900);
    sendSuccess(res, result);
  } catch (err) {
    console.error("Error fetching details:", err);
    return sendError(res, err.message || "Failed to fetch details", err.status || 500);
  }
};

export default { getRestaurantDetails };
