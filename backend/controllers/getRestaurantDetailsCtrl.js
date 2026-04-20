import NodeCache from "node-cache";
import { formatRestaurantDetails } from "../utils/restaurantFormatter.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import { fetchGooglePlaceDetails } from "../services/googlePlacesService.js";
import { summarizeReviews } from "../services/aiService.js";

// Cache restaurant details for 15 minutes — details change infrequently
const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

/**
 * Controller to fetch in-depth information about a specific restaurant.
 * Uses caching to reduce latency and API calls, and normalizes the payload.
 * 
 * @param {Object} req - Express request object containing the place ID parameter.
 * @param {Object} res - Express response object.
 */
const getRestaurantDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) return sendError(res, "Missing restaurant ID", 400);

  // Check the short-term cache to resolve instantly if heavily requested
  const cached = cache.get(id);
  if (cached) return sendSuccess(res, cached);

  try {
    const apiKey = process.env.PLACES_API_KEY;

    // Define specifically which data chunks we want to fetch, omitting unnecessary data to cut costs
    const FIELD_MASK = [
      "id", "displayName", "rating", "userRatingCount", "priceLevel",
      "formattedAddress", "addressComponents", "location", "photos",
      "types", "googleMapsUri", "nationalPhoneNumber", "regularOpeningHours",
      "websiteUri", "reviews",
    ].join(",");

    // Await the API fetch safely using our abstracted service layer
    const placeData = await fetchGooglePlaceDetails(id, apiKey, FIELD_MASK);

    const backendUrl = process.env.BACKEND_URL || '';

    // Process the raw verbose Google object mapping it strictly to the Yelp abstraction our frontend expects
    const result = formatRestaurantDetails(placeData, backendUrl);

    // Generate AI vibe summary from reviews if available (non-blocking — don't fail if Groq errors)
    if (placeData.reviews?.length) {
      try {
        result.aiSummary = await summarizeReviews(placeData.reviews.slice(0, 5));
      } catch {
        result.aiSummary = null;
      }
    }

    // Save mapping securely into our cache before replying
    cache.set(id, result);
    sendSuccess(res, result);
  } catch (err) {
    console.error("Error fetching details:", err);
    // Use proper inherited error fallback
    return sendError(res, err.message || "Failed to fetch details", err.status || 500);
  }
};

export default { getRestaurantDetails };
