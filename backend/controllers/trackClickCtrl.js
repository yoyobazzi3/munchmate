import { getCollection } from "../config/mongodb.js";
import { getRestaurantFromCache, getRestaurantDetails } from "../services/restaurantService.js";
import { ObjectId } from "mongodb";

const trackClick = async (req, res) => {
    const { user_id, restaurant_id } = req.body;
    console.log("➡️ trackClick called with:", { user_id, restaurant_id });
  
    if (!user_id || !restaurant_id) {
      console.log("❌ Missing user_id or restaurant_id");
      return res.status(400).json({ error: "Missing user_id or restaurant_id" });
    }
  
    try {
      const clicksCollection = await getCollection('clicks');
      
      // 1. Insert click into MongoDB
      await clicksCollection.insertOne({
        userId: new ObjectId(user_id),
        restaurantId: restaurant_id,
        itemType: 'restaurant',
        clickedAt: new Date()
      });
      console.log("✅ Click logged");
  
      // 2. Check if restaurant already exists in cache
      const existing = await getRestaurantFromCache(restaurant_id);
      if (existing) {
        console.log("ℹ️ Restaurant already exists in cache");
        return res.status(200).json({ message: "Click tracked only" });
      }
  
      // 3. Fetch restaurant details (will use cache or Yelp API)
      try {
        await getRestaurantDetails(restaurant_id);
        console.log("✅ Restaurant data cached");
        res.status(200).json({ message: "Click + restaurant saved" });
      } catch (yelpError) {
        // If Yelp API fails but click was logged, still return success
        console.log("⚠️ Could not fetch restaurant data, but click was logged");
        res.status(200).json({ message: "Click tracked (restaurant data unavailable)" });
      }
  
    } catch (err) {
      console.error("🔥 Error in trackClick:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

const getClickHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const clicksCollection = await getCollection('clicks');
    const restaurantsCollection = await getCollection('restaurants');
    
    // Find clicks for this user, sorted by most recent
    const clicks = await clicksCollection
      .find({ userId: new ObjectId(userId) })
      .sort({ clickedAt: -1 })
      .limit(10)
      .toArray();

    // Get restaurant details for each click
    const restaurantIds = clicks.map(click => click.restaurantId);
    const restaurants = await restaurantsCollection
      .find({ _id: { $in: restaurantIds } })
      .toArray();

    // Create a map for quick lookup
    const restaurantMap = new Map(restaurants.map(r => [r._id, r]));

    // Combine click data with restaurant data
    const history = clicks
      .map(click => {
        const restaurant = restaurantMap.get(click.restaurantId);
        return restaurant || null;
      })
      .filter(Boolean); // Remove nulls

    res.json(history);
  } catch (error) {
    console.error("Error fetching click history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default { trackClick, getClickHistory };