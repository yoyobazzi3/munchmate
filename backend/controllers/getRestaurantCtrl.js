import { searchRestaurants } from '../services/restaurantService.js';

/**
 * GET /getRestaurants
 * Works with EITHER:
 *   • latitude & longitude   – from getUserLocation()
 *   • location=<city, state> – typed in the Home page
 * 
 * Now uses caching - checks MongoDB first, only calls Yelp API if needed
 */
const getAllRestaurants = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      location,
      price,
      category,
      radius = 5000,
      sortBy = "best_match",
      term = "",
    } = req.query;

    // Must have *either* location or lat/lon
    if (!(location || (latitude && longitude))) {
      return res
        .status(400)
        .json({ error: "Provide latitude+longitude OR a location string." });
    }

    const params = {
      location,
      latitude,
      longitude,
      price,
      category,
      radius,
      sortBy,
      term
    };

    const restaurants = await searchRestaurants(params);
    res.json(restaurants);
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

export default { getAllRestaurants };