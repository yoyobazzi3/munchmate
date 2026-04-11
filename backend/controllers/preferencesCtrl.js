import { sendError, sendSuccess } from "../utils/responseHandler.js";
// All database queries are abstracted into the repository layer
import userRepository from "../repositories/userRepository.js";

const preferencesCtrl = {
  getPreferences: async (req, res) => {
    try {
      const rows = await userRepository.getPreferences(req.user.userId);

      if (!rows.length) {
        return sendSuccess(res, { favoriteCuisines: [], preferredPriceRange: "" });
      }

      const { favorite_cuisines, preferred_price_range } = rows[0];
      const cuisines = typeof favorite_cuisines === "string"
        ? JSON.parse(favorite_cuisines || "[]")
        : (favorite_cuisines || []);
      sendSuccess(res, {
        favoriteCuisines: cuisines,
        preferredPriceRange: preferred_price_range || "",
      });
    } catch (error) {
      sendError(res);
    }
  },

  updatePreferences: async (req, res) => {
    try {
      const { favoriteCuisines, preferredPriceRange } = req.body;

      await userRepository.upsertPreferences(
        req.user.userId,
        JSON.stringify(favoriteCuisines || []),
        preferredPriceRange ?? ''
      );

      sendSuccess(res, { message: "Preferences saved." });
    } catch (error) {
      sendError(res);
    }
  },
};

export default preferencesCtrl;
