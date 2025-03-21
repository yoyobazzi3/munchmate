import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const YELP_API_KEY = process.env.YELP_API_KEY;
const YELP_API_URL = "https://api.yelp.com/v3/businesses/search";

const getAllRestaurants = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      price,
      category,
      radius,
      sortBy = "best_match",
      term = "" 
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const params = new URLSearchParams({
      latitude,
      longitude,
      categories: category || "restaurants",
      radius: radius || "5000",
      sort_by: sortBy,
      limit: "50",
    });

    if (price) params.append("price", price);
    if (term) params.append("term", term); 

    const yelpURL = `${YELP_API_URL}?${params.toString()}`;
    console.log("🌐 Yelp URL:", yelpURL);

    const response = await fetch(yelpURL, {
      headers: {
        Authorization: `Bearer ${YELP_API_KEY}`
      }
    });

    const data = await response.json();
    console.log("✅ Yelp Response:", data);

    if (!response.ok) {
      console.error("❌ Yelp Error:", data);
      return res.status(response.status).json({ error: "Failed to fetch from Yelp", details: data });
    }

    if (!data.businesses) {
      return res.status(500).json({ error: "Unexpected response from Yelp" });
    }

    res.json(data.businesses);
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export default { getAllRestaurants };