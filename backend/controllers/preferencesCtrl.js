import { queryDB } from "../config/db.js";

const preferencesCtrl = {
  getPreferences: async (req, res) => {
    try {
      const rows = await queryDB(
        "SELECT favorite_cuisines, preferred_price_range FROM user_preferences WHERE user_id = ?",
        [req.user.userId]
      );

      if (!rows.length) {
        return res.json({ favoriteCuisines: [], preferredPriceRange: "" });
      }

      const { favorite_cuisines, preferred_price_range } = rows[0];
      const cuisines = typeof favorite_cuisines === "string"
        ? JSON.parse(favorite_cuisines || "[]")
        : (favorite_cuisines || []);
      res.json({
        favoriteCuisines: cuisines,
        preferredPriceRange: preferred_price_range || "",
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  updatePreferences: async (req, res) => {
    try {
      const { favoriteCuisines, preferredPriceRange } = req.body;

      await queryDB(
        `INSERT INTO user_preferences (user_id, favorite_cuisines, preferred_price_range)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           favorite_cuisines = VALUES(favorite_cuisines),
           preferred_price_range = VALUES(preferred_price_range)`,
        [req.user.userId, JSON.stringify(favoriteCuisines || []), preferredPriceRange ?? ""]
      );

      res.json({ message: "Preferences saved." });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

export default preferencesCtrl;
