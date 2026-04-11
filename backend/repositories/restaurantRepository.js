/**
 * restaurantRepository.js — Database Access Layer for Restaurants & Clicks
 *
 * All SQL queries related to the `restaurants` and `user_clicks` tables live here.
 * Controllers call these functions instead of writing raw SQL inline.
 */

import pool from '../config/db.js';

const restaurantRepository = {
  /**
   * Check if a restaurant is already cached in our database.
   * Used by trackClick to avoid redundant Google Places API calls.
   * @param {string} restaurantId
   * @returns {Array} Matching rows (check .length > 0)
   */
  findById: async (restaurantId) => {
    const [rows] = await pool.query(
      // Select photo_reference too so the controller can decide
      // whether to skip re-fetching (photo exists) or proceed (photo is null)
      'SELECT id, photo_reference FROM restaurants WHERE id = ?',
      [restaurantId]
    );
    return rows;
  },

  /**
   * Insert a restaurant into the local database cache.
   * Called after fetching fresh data from Google Places API.
   * @param {object} data - Normalized restaurant data
   */
  cacheRestaurant: (data) =>
    pool.query(
      // INSERT...ON DUPLICATE KEY UPDATE so this works whether the restaurant
      // is new OR already exists with a null photo_reference.
      // photo_reference is always updated to the latest value from the API.
      `INSERT INTO restaurants (id, name, address, latitude, longitude, price, rating, review_count, category, photo_reference, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         photo_reference = VALUES(photo_reference),
         last_updated = NOW()`,
      [
        data.id,
        data.name,
        data.address,
        data.latitude,
        data.longitude,
        data.price,
        data.rating,
        data.reviewCount,
        data.category,
        data.photoReference,
      ]
    ),

  /**
   * Log a user's click on a restaurant for "recently viewed" tracking.
   * @param {number} userId
   * @param {string} restaurantId
   */
  logClick: (userId, restaurantId) =>
    pool.query(
      'INSERT INTO user_clicks (user_id, restaurant_id) VALUES (?, ?)',
      [userId, restaurantId]
    ),

  /**
   * Get the 10 most recently clicked restaurants for a user.
   * Joins the restaurants cache table to get their full details.
   * @param {number} userId
   * @returns {Array} Sorted array of restaurant rows
   */
  getClickHistory: async (userId) => {
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
    return rows;
  },
};

export default restaurantRepository;
