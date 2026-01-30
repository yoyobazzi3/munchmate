import { getCollection } from "../config/mongodb.js";
import { saveRestaurantToCache } from "../services/restaurantService.js";

const saveRestaurants = async (req, res) => {
  const restaurants = req.body;

  if (!Array.isArray(restaurants)) {
    return res.status(400).json({ error: "Expected an array of restaurants" });
  }

  try {
    // Use the restaurant service to save each restaurant (handles caching)
    for (const restaurant of restaurants) {
      try {
        await saveRestaurantToCache(restaurant);
      } catch (err) {
        console.error(`Error saving restaurant ${restaurant.id}:`, err);
        // Continue with other restaurants even if one fails
      }
    }

    res.status(200).json({ message: "Restaurants saved/updated" });
  } catch (err) {
    console.error("Error saving restaurants:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default { saveRestaurants };