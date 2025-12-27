import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const YELP_API_KEY = process.env.YELP_API_KEY;
const YELP_API_URL = "https://api.yelp.com/v3/businesses/search";

/**
 * GET /getRestaurants
 * Works with EITHER:
 *   • latitude & longitude   – from getUserLocation()
 *   • location=<city, state> – typed in the Home page
 */
const getAllRestaurants = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      location,            // ← NEW  (plain-text address or city)
      price,
      category,
      radius   = 5000,
      sortBy   = "best_match",
      term     = "",
    } = req.query;

    // Must have *either* location or lat/lon
    if (!(location || (latitude && longitude))) {
      return res
        .status(400)
        .json({ error: "Provide latitude+longitude OR a location string." });
    }

    const params = new URLSearchParams({
      categories: category || "restaurants",
      radius,
      sort_by: sortBy,
      limit: 50,
    });

    if (location)  params.append("location" , location);
    if (latitude)  params.append("latitude" , latitude);
    if (longitude) params.append("longitude", longitude);
    if (price)     params.append("price"    , price);
    if (term)      params.append("term"     , term);

    const yelpURL  = `${YELP_API_URL}?${params.toString()}`;
    const response = await fetch(yelpURL, {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Yelp error:", data);
      return res
        .status(response.status)
        .json({ error: "Failed to fetch from Yelp", details: data });
    }

    res.json(data.businesses || []);
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

export default { getAllRestaurants };