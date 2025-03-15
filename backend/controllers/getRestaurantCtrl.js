import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes cache expiration
const cache = new Map(); // ✅ Store cached results

// Haversine formula to calculate distance in miles
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Earth radius in miles
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
};

// Fetch a single page from Google Places API
const fetchRestaurantsPage = async (url) => {
  const response = await axios.get(url);
  if (response.data.status !== "OK") throw new Error("Error fetching data from Google API");

  return {
    restaurants: response.data.results,
    nextPageToken: response.data.next_page_token || null,
  };
};

const getRestaurantCtrl = {
  getAllRestaurants: async (req, res) => {
    try {
      let { lat, lng, radius, price, type, minRating, pageToken } = req.query;
      lat = parseFloat(lat);
      lng = parseFloat(lng);

      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      // Generate Cache Key (Ensures uniqueness based on filters)
      const cacheKey = `${lat}-${lng}-${radius}-${price}-${type}-${minRating}-${pageToken || "firstPage"}`;

      // ✅ Return cached data if available and not expired
      if (cache.has(cacheKey)) {
        const { timestamp, data } = cache.get(cacheKey);
        if (Date.now() - timestamp < CACHE_EXPIRATION) {
          console.log("✅ Returning cached restaurants for:", cacheKey);
          return res.status(200).json(data);
        }
      }

      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius || 5000}&type=${type || "restaurant"}&key=${GOOGLE_API_KEY}`;

      if (price) {
        const minPrice = Math.max(0, parseInt(price) - 1);
        const maxPrice = Math.min(4, parseInt(price));
        url += `&minprice=${minPrice}&maxprice=${maxPrice}`;
      }

      // If a pageToken is provided, fetch the next set of results
      if (pageToken) {
        url += `&pagetoken=${pageToken}`;
      }

      console.log("Fetching fresh data for:", cacheKey);
      const { restaurants: places, nextPageToken } = await fetchRestaurantsPage(url);

      let restaurants = places.map((place) => {
        const restaurantLat = place.geometry.location.lat;
        const restaurantLng = place.geometry.location.lng;
        const distance = calculateDistance(lat, lng, restaurantLat, restaurantLng).toFixed(2); // Distance in miles

        // Extract photo reference (if available)
        const photoReference = place.photos ? place.photos[0].photo_reference : null;
        const photoUrl = photoReference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`
          : "https://via.placeholder.com/400"; // Placeholder if no image

        return {
          name: place.name,
          rating: place.rating || 0,
          address: place.vicinity,
          price_level: place.price_level || "N/A",
          type: place.types || [],
          distance,
          place_id: place.place_id,
          photoUrl, // Add image URL
        };
      });

      const responseData = { restaurants, nextPageToken };

      // ✅ Cache results
      cache.set(cacheKey, { timestamp: Date.now(), data: responseData });

      console.log(`✅ Found ${restaurants.length} unique restaurants`);
      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error fetching restaurants:", error.message);
      res.status(500).json({ error: "Server error" });
    }
  },
};

export default getRestaurantCtrl;