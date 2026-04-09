import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

const PRICE_MAP = {
  "1": "PRICE_LEVEL_INEXPENSIVE",
  "2": "PRICE_LEVEL_MODERATE",
  "3": "PRICE_LEVEL_EXPENSIVE",
  "4": "PRICE_LEVEL_VERY_EXPENSIVE",
};

const SORT_MAP = {
  "rating": "RATING",
  "distance": "DISTANCE",
};

const priceToSymbol = (level) => ({
  PRICE_LEVEL_FREE: "$",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}[level] || null);

const normalizePlaces = (places, apiKey) =>
  places.map(place => ({
    id: place.id,
    name: place.displayName?.text || "",
    rating: place.rating || 0,
    review_count: place.userRatingCount || 0,
    price: priceToSymbol(place.priceLevel),
    image_url: place.photos?.[0]
      ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=400&key=${apiKey}`
      : null,
    location: {
      address1: place.shortFormattedAddress || place.formattedAddress || "",
    },
    coordinates: {
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
    },
    categories: (place.types || []).slice(0, 2).map(t => ({
      alias: t,
      title: t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    })),
    url: place.googleMapsUri || "",
    dineIn: place.dineIn ?? null,
    takeout: place.takeout ?? null,
    delivery: place.delivery ?? null,
  }));

const getAllRestaurants = async (req, res) => {
  try {
    const {
      latitude, longitude, location,
      price, category, radius = 5000,
      sortBy = "best_match", term = "",
      diningOption = "all",
    } = req.query;

    if (!(location || (latitude && longitude))) {
      return res.status(400).json({ error: "Provide latitude+longitude OR a location string." });
    }

    const apiKey = process.env.PLACES_API_KEY;

    // Build text query
    const base = term || category || "restaurants";
    const textQuery = location ? `${base} in ${location}` : base;

    const baseBody = { textQuery, maxResultCount: 20 };

    if (latitude && longitude) {
      baseBody.locationBias = {
        circle: {
          center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          radius: parseFloat(radius),
        },
      };
    }

    if (SORT_MAP[sortBy]) baseBody.rankPreference = SORT_MAP[sortBy];
    if (price) baseBody.priceLevels = price.split(",").map(p => PRICE_MAP[p]).filter(Boolean);

    const FIELD_MASK = [
      "places.id", "places.displayName", "places.rating",
      "places.userRatingCount", "places.priceLevel",
      "places.formattedAddress", "places.shortFormattedAddress",
      "places.location", "places.photos", "places.types", "places.googleMapsUri",
      "places.dineIn", "places.takeout", "places.delivery",
      "nextPageToken",
    ].join(",");

    // Fetch up to 3 pages (60 results)
    let allPlaces = [];
    let pageToken = null;
    const MAX_PAGES = 3;

    for (let page = 0; page < MAX_PAGES; page++) {
      const body = { ...baseBody };
      if (pageToken) body.pageToken = pageToken;

      const response = await fetch(PLACES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (page === 0) {
          console.error("Places API error:", data);
          return res.status(response.status).json({ error: "Failed to fetch from Google Places", details: data });
        }
        break;
      }

      allPlaces = allPlaces.concat(data.places || []);
      pageToken = data.nextPageToken || null;
      if (!pageToken) break;
    }

    let results = normalizePlaces(allPlaces, apiKey);

    if (diningOption === "dine-in") results = results.filter(r => r.dineIn !== false);
    else if (diningOption === "takeout") results = results.filter(r => r.takeout !== false);
    else if (diningOption === "delivery") results = results.filter(r => r.delivery !== false);

    res.json(results);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

export default { getAllRestaurants };
