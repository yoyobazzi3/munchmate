import pool from "../config/db.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const priceToSymbol = (level) => ({
  PRICE_LEVEL_FREE: "$",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}[level] || null);

const trackClick = async (req, res) => {
  const { user_id, restaurant_id } = req.body;

  if (!user_id || !restaurant_id) {
    return res.status(400).json({ error: "Missing user_id or restaurant_id" });
  }

  try {
    // 1. Log the click
    await pool.query(
      "INSERT INTO user_clicks (user_id, restaurant_id) VALUES (?, ?)",
      [user_id, restaurant_id]
    );

    // 2. Skip if restaurant already cached
    const [existing] = await pool.query("SELECT id FROM restaurants WHERE id = ?", [restaurant_id]);
    if (existing.length > 0) {
      return res.status(200).json({ message: "Click tracked only" });
    }

    // 3. Fetch from Google Places and cache
    const apiKey = process.env.PLACES_API_KEY;
    const response = await fetch(`https://places.googleapis.com/v1/places/${restaurant_id}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,priceLevel,rating,userRatingCount,types,photos",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(502).json({ error: "Failed to fetch from Google Places", details: error });
    }

    const p = await response.json();
    const photo_reference = p.photos?.[0]?.name || null;

    await pool.query(
      `INSERT INTO restaurants (id, name, address, latitude, longitude, price, rating, review_count, category, photo_reference, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        p.id,
        p.displayName?.text || "",
        p.formattedAddress || "",
        p.location?.latitude || null,
        p.location?.longitude || null,
        priceToSymbol(p.priceLevel),
        p.rating || 0,
        p.userRatingCount || 0,
        p.types?.[0]?.replace(/_/g, " ") || null,
        photo_reference,
      ]
    );

    res.status(200).json({ message: "Click + restaurant saved" });
  } catch (err) {
    console.error("Error in trackClick:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getClickHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT r.*
       FROM restaurants r
       INNER JOIN (
         SELECT restaurant_id, MAX(clicked_at) as last_clicked
         FROM user_clicks
         WHERE user_id = ?
         GROUP BY restaurant_id
       ) latest ON r.id = latest.restaurant_id
       ORDER BY latest.last_clicked DESC
       LIMIT 10`,
      [userId]
    );

    const apiKey = process.env.PLACES_API_KEY;
    const normalized = rows.map(r => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      review_count: r.review_count,
      price: r.price,
      image_url: r.photo_reference
        ? `https://places.googleapis.com/v1/${r.photo_reference}/media?maxWidthPx=400&key=${apiKey}`
        : null,
      location: { address1: r.address },
      coordinates: { latitude: r.latitude, longitude: r.longitude },
      categories: r.category ? [{ alias: r.category, title: r.category }] : [],
    }));

    res.json(normalized);
  } catch (error) {
    console.error("Error fetching click history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default { trackClick, getClickHistory };
