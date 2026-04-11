import { priceToSymbol, normalizeDatabasePlace } from "../utils/restaurantFormatter.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import { fetchGooglePlaceDetails } from "../services/googlePlacesService.js";

// All database queries are abstracted into the repository layer
import restaurantRepository from "../repositories/restaurantRepository.js";

/**
 * Controller to track deep engagements (clicks) on restaurant cards.
 * If the clicked restaurant is not cached in our SQL DB, we use the Google API 
 * to fetch and quietly persist its summary to quickly hydrate future loads.
 */
const trackClickCtrl = {
  /**
   * Logs a clicking event to history and ensures the restaurant is locally cached.
   * 
   * @param {Object} req - Express request object containing `restaurant_id`.
   * @param {Object} res - Express response object.
   */
  trackClick: async (req, res) => {
    const { restaurant_id } = req.body;
    const user_id = req.user.userId; // always use the authenticated user's ID

    if (!restaurant_id) {
      return sendError(res, "Missing restaurant_id", 400);
    }

    try {
      // 1. Instantly log the click constraint in user_clicks table
      await restaurantRepository.logClick(user_id, restaurant_id);

      // 2. Optimization: If restaurant is cached AND already has a photo, skip the Places API call
      //    If photo_reference is null, fall through and re-fetch to resolve its image url natively
      const existing = await restaurantRepository.findById(restaurant_id);
      if (existing.length > 0 && existing[0].photo_reference) {
        return sendSuccess(res, { message: "Click tracked locally" });
      }

      // 3. Fetch shallow summary directly from Google Google Places API
      const apiKey = process.env.PLACES_API_KEY;
      const FIELD_MASK = "id,displayName,formattedAddress,location,priceLevel,rating,userRatingCount,types,photos";

      // Execute external call
      const p = await fetchGooglePlaceDetails(restaurant_id, apiKey, FIELD_MASK);

      // 4. Cache the restaurant firmly in our database for instantaneous historic recalls
      await restaurantRepository.cacheRestaurant({
        id: p.id,
        name: p.displayName?.text || "",
        address: p.formattedAddress || "",
        latitude: p.location?.latitude || null,
        longitude: p.location?.longitude || null,
        price: priceToSymbol(p.priceLevel),
        rating: p.rating || 0,
        reviewCount: p.userRatingCount || 0,
        category: p.types?.[0]?.replace(/_/g, " ") || null,
        photoReference: p.photos?.[0]?.name || null,
      });

      sendSuccess(res, { message: "Click tracked and restaurant cached" });
    } catch (err) {
      console.error("Error in trackClick:", err);
      sendError(res, "Failed to track click or fetch place details", 500);
    }
  },

  /**
   * Pulls the user's localized click history from our database and hydrates 
   * them up to match standard frontend schema layout.
   * 
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  getClickHistory: async (req, res) => {
    const userId = req.user.userId; // safely ignore URL param — always use the authenticated user

    try {
      // Fetch flat click history rows via the restaurant repository
      const rows = await restaurantRepository.getClickHistory(userId);

      const backendUrl = process.env.BACKEND_URL || '';
      
      // Standardize flat rows identically against the Places API arrays 
      const normalized = normalizeDatabasePlace(rows, backendUrl);

      sendSuccess(res, normalized);
    } catch (error) {
      console.error("Error fetching click history:", error);
      sendError(res, "Failed to fetch click history", 500);
    }
  }
};

export default trackClickCtrl;
