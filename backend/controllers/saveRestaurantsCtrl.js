import pool from "../config/db.js";

const saveRestaurants = async (req, res) => {
  const restaurants = req.body;

  if (!Array.isArray(restaurants)) {
    return res.status(400).json({ error: "Expected an array of restaurants" });
  }

  try {
    for (const restaurant of restaurants) {
      const {
        id,
        name,
        location,
        coordinates,
        price,
        rating,
        review_count,
        categories,
        image_url,
      } = restaurant;

      const address = location?.address1 || "";
      const latitude = coordinates?.latitude || null;
      const longitude = coordinates?.longitude || null;
      const category = categories?.[0]?.title || null;

      // Extract "places/.../photos/..." from the full URL
      const photoMatch = image_url?.match(/v1\/(places\/[^/]+\/photos\/[^/]+)/);
      const photo_reference = photoMatch?.[1] || null;

      await pool.query(
        `INSERT INTO restaurants (id, name, address, latitude, longitude, price, rating, review_count, category, photo_reference, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           address = VALUES(address),
           latitude = VALUES(latitude),
           longitude = VALUES(longitude),
           price = VALUES(price),
           rating = VALUES(rating),
           review_count = VALUES(review_count),
           category = VALUES(category),
           photo_reference = VALUES(photo_reference),
           last_updated = NOW()`,
        [id, name, address, latitude, longitude, price, rating, review_count, category, photo_reference]
      );
    }

    res.status(200).json({ message: "Restaurants saved/updated" });
  } catch (err) {
    console.error("Error saving restaurants:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default { saveRestaurants };
