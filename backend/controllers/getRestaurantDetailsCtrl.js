import { getRestaurantDetails } from '../services/restaurantService.js';

const getRestaurantDetailsCtrl = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing restaurant ID" });

  try {
    const restaurant = await getRestaurantDetails(id);
    res.json(restaurant);
  } catch (err) {
    console.error("Error fetching restaurant details:", err);
    
    // If it's a Yelp API error, return a more user-friendly message
    if (err.message?.includes('Yelp API')) {
      return res.status(503).json({ 
        error: "Restaurant service temporarily unavailable. Please try again later." 
      });
    }
    
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default { getRestaurantDetails: getRestaurantDetailsCtrl };