import { sendError, sendSuccess } from "../utils/responseHandler.js";
import { validatePreferencesPayload } from "../utils/validators/preferencesValidator.js";
// All database queries are abstracted into the repository layer
import userRepository from "../repositories/userRepository.js";

/**
 * Controller handling user-specific restaurant preferences (e.g. cuisines and pricing bounds).
 */
const preferencesCtrl = {
  /**
   * Retrieves the current user's saved preferences from the database.
   * If they don't have any saved, returns an empty default state.
   * 
   * @param {Object} req - Express request object containing the user token.
   * @param {Object} res - Express response object.
   */
  getPreferences: async (req, res) => {
    try {
      const rows = await userRepository.getPreferences(req.user.userId);

      // Return graceful empty defaults if record doesn't exist yet
      if (!rows.length) {
        return sendSuccess(res, { favoriteCuisines: [], preferredPriceRange: "" });
      }

      const { favorite_cuisines, preferred_price_range } = rows[0];
      
      // Parse database JSON string into an array if needed, fallback to empty array
      const cuisines = typeof favorite_cuisines === "string"
        ? JSON.parse(favorite_cuisines || "[]")
        : (favorite_cuisines || []);
        
      sendSuccess(res, {
        favoriteCuisines: cuisines,
        preferredPriceRange: preferred_price_range || "",
      });
    } catch (error) {
      console.error("fetch Preferences error:", error);
      sendError(res, "Failed to retrieve preferences", 500);
    }
  },

  /**
   * Upserts the user's favorite cuisines and price ranges in the database.
   * 
   * @param {Object} req - Express request object containing the payload.
   * @param {Object} res - Express response object.
   */
  updatePreferences: async (req, res) => {
    try {
      // Validate incoming data payload types and boundaries
      const validation = validatePreferencesPayload(req.body);
      if (!validation.isValid) {
        return sendError(res, validation.error, 400);
      }

      const { favoriteCuisines, preferredPriceRange } = req.body;

      // Upsert: Create row if it doesn't exist, update if it does.
      await userRepository.upsertPreferences(
        req.user.userId,
        JSON.stringify(favoriteCuisines || []),
        preferredPriceRange ?? ''
      );

      sendSuccess(res, { 
        favoriteCuisines: favoriteCuisines || [],
        preferredPriceRange: preferredPriceRange ?? "",
        message: "Preferences saved successfully." 
      });
    } catch (error) {
       console.error("update Preferences error:", error);
      sendError(res, "Failed to update preferences", 500);
    }
  },
};

export default preferencesCtrl;
