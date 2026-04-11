import { queryDB } from '../config/db.js';

/**
 * Repository: Restaurant Caching & History Data Access Layer
 *
 * Dedicated repository handling all MySQL queries tied to the `restaurants` and `user_clicks` tables.
 * Centralizes duplicate data caching workflows and click event auditing.
 */
const restaurantRepository = {
  /**
   * Evaluates if a given Google Place is already cached inside our MySQL DB.
   * Leveraged predominantly by controllers before blindly firing outbound Google API calls.
   * 
   * @param {string} restaurantId - The unique Google Place ID.
   * @returns {Promise<Array>} Matching data rows detailing cache existence (check .length).
   */
  findById: (restaurantId) =>
    queryDB(
      // Select photo_reference securely so routing logic can bypass re-fetching or resolve missing images.
      'SELECT id, photo_reference FROM restaurants WHERE id = ?',
      [restaurantId]
    ),

  /**
   * Persists normalized restaurant data silently fetched from the Google Places API into the local DB.
   * If the establishment exists but is missing robust data (e.g. `photo_reference`), it gracefully upserts.
   * 
   * @param {Object} data - Processed and normalized restaurant metadata.
   * @returns {Promise<Array>} The query execution result metadata.
   */
  cacheRestaurant: (data) =>
    queryDB(
      // INSERT...ON DUPLICATE KEY UPDATE: Upserts flawlessly even if the row already exists.
      // Automatically stamps a `last_updated` MySQL signature.
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
   * Audits a precise trackable click to a user's engagement history.
   * 
   * @param {number} userId - The authenticated user's ID.
   * @param {string} restaurantId - The Google Place ID that was interacted with.
   * @returns {Promise<Array>} The query execution result metadata.
   */
  logClick: (userId, restaurantId) =>
    queryDB(
      'INSERT INTO user_clicks (user_id, restaurant_id) VALUES (?, ?)',
      [userId, restaurantId]
    ),

  /**
   * Safely collects the top 10 most recently engaged restaurants for a precise user.
   * Executes an inner join locally inside MySQL against the `restaurants` table to hydrate the payload natively.
   * 
   * @param {number} userId - The target user's identifier.
   * @returns {Promise<Array>} Sorted flat array of heavily populated restaurant records.
   */
  getClickHistory: (userId) =>
    queryDB(
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
    ),
};

export default restaurantRepository;
