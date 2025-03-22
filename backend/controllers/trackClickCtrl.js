import pool from "../config/db.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const YELP_API_KEY = process.env.YELP_API_KEY;

const trackClick = async (req, res) => {
    const { user_id, restaurant_id } = req.body;
    console.log("➡️ trackClick called with:", { user_id, restaurant_id });
  
    if (!user_id || !restaurant_id) {
      console.log("❌ Missing user_id or restaurant_id");
      return res.status(400).json({ error: "Missing user_id or restaurant_id" });
    }
  
    try {
      // 1. Insert into clicks
      await pool.query(
        "INSERT INTO user_clicks (user_id, restaurant_id) VALUES (?, ?)",
        [user_id, restaurant_id]
      );
      console.log("✅ Click logged");
  
      // 2. Check if restaurant already exists
      const [existing] = await pool.query("SELECT id FROM restaurants WHERE id = ?", [restaurant_id]);
      if (existing.length > 0) {
        console.log("ℹ️ Restaurant already exists in DB");
        return res.status(200).json({ message: "Click tracked only" });
      }
  
      // 3. Fetch from Yelp
      const yelpRes = await fetch(`https://api.yelp.com/v3/businesses/${restaurant_id}`, {
        headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` }
      });
  
      console.log("🌐 Yelp API status:", yelpRes.status);
  
      if (!yelpRes.ok) {
        const error = await yelpRes.json();
        console.log("❌ Yelp API error:", error);
        return res.status(502).json({ error: "Failed to fetch from Yelp", details: error });
      }
  
      const data = await yelpRes.json();
      console.log("✅ Yelp data received:", data.name);
  
      const {
        id, name, location, coordinates, price,
        rating, review_count, categories
      } = data;
  
      const address = location?.address1 || "";
      const latitude = coordinates?.latitude || null;
      const longitude = coordinates?.longitude || null;
      const category = categories?.[0]?.title || null;
  
      await pool.query(
        `INSERT INTO restaurants (id, name, address, latitude, longitude, price, rating, review_count, category, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id, name, address, latitude, longitude, price, rating, review_count, category]
      );
  
      console.log("✅ Restaurant inserted");
  
      res.status(200).json({ message: "Click + restaurant saved" });
  
    } catch (err) {
      console.error("🔥 Error in trackClick:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

const getClickHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT r.*
       FROM restaurant_clicks c
       JOIN restaurants r ON c.restaurant_id = r.id
       WHERE c.user_id = ?
       ORDER BY c.clicked_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching click history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default { trackClick, getClickHistory };