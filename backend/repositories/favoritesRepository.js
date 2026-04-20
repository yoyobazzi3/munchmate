import { queryDB } from '../config/db.js';
import { normalizeDatabasePlace } from '../utils/restaurantFormatter.js';

const favoritesRepository = {
  addFavorite: (userId, restaurantId) =>
    queryDB(
      'INSERT IGNORE INTO user_favorites (user_id, restaurant_id) VALUES (?, ?)',
      [userId, restaurantId]
    ),

  removeFavorite: (userId, restaurantId) =>
    queryDB(
      'DELETE FROM user_favorites WHERE user_id = ? AND restaurant_id = ?',
      [userId, restaurantId]
    ),

  getFavorites: async (userId, backendUrl) => {
    const rows = await queryDB(
      `SELECT r.*, uf.note, uf.status, uf.rating, uf.amount_spent
       FROM restaurants r
       INNER JOIN user_favorites uf ON r.id = uf.restaurant_id
       WHERE uf.user_id = ?
       ORDER BY uf.saved_at DESC`,
      [userId]
    );
    return normalizeDatabasePlace(rows, backendUrl);
  },

  updateFavorite: (userId, restaurantId, { note, status, rating }) =>
    queryDB(
      `UPDATE user_favorites SET note = ?, status = ?, rating = ? WHERE user_id = ? AND restaurant_id = ?`,
      [note ?? null, status ?? 'want_to_go', rating ?? null, userId, restaurantId]
    ),

  getRatedFavorites: (userId) =>
    queryDB(
      `SELECT r.name, r.category, uf.rating
       FROM user_favorites uf
       INNER JOIN restaurants r ON uf.restaurant_id = r.id
       WHERE uf.user_id = ? AND uf.rating IS NOT NULL`,
      [userId]
    ),

  isFavorite: async (userId, restaurantId) => {
    const rows = await queryDB(
      'SELECT 1 FROM user_favorites WHERE user_id = ? AND restaurant_id = ?',
      [userId, restaurantId]
    );
    return rows.length > 0;
  },

  updateSpend: (userId, restaurantId, amount) =>
    queryDB(
      `INSERT INTO spend_logs (user_id, restaurant_id, amount) VALUES (?, ?, ?)`,
      [userId, restaurantId, amount]
    ),

  getSpendLogs: (userId, restaurantId) =>
    queryDB(
      `SELECT sl.amount, sl.visited_at, r.name AS restaurant_name, r.category
       FROM spend_logs sl
       INNER JOIN restaurants r ON sl.restaurant_id = r.id
       WHERE sl.user_id = ? AND sl.restaurant_id = ?
       ORDER BY sl.visited_at DESC`,
      [userId, restaurantId]
    ),

  getVisitedWithSpend: (userId) =>
    queryDB(
      `SELECT r.id, r.name, r.category, r.price,
              COALESCE(SUM(sl.amount), 0)  AS total_spent,
              COUNT(sl.id)                 AS visit_count,
              MAX(sl.visited_at)           AS last_visit
       FROM user_favorites uf
       INNER JOIN restaurants r ON uf.restaurant_id = r.id
       LEFT JOIN spend_logs sl ON sl.user_id = uf.user_id AND sl.restaurant_id = uf.restaurant_id
       WHERE uf.user_id = ? AND uf.status = 'visited'
       GROUP BY r.id, r.name, r.category, r.price
       ORDER BY last_visit DESC`,
      [userId]
    ),

  getSpendSummary: async (userId) => {
    const [totals, topCat] = await Promise.all([
      queryDB(
        `SELECT
           SUM(sl.amount) AS total,
           AVG(sl.amount) AS avg_per_meal,
           COUNT(*)       AS meal_count
         FROM spend_logs sl
         WHERE sl.user_id = ?`,
        [userId]
      ),
      queryDB(
        `SELECT r.category AS top_category
         FROM spend_logs sl
         INNER JOIN restaurants r ON sl.restaurant_id = r.id
         WHERE sl.user_id = ?
         GROUP BY r.category
         ORDER BY SUM(sl.amount) DESC
         LIMIT 1`,
        [userId]
      ),
    ]);
    const row = totals[0] ?? {};
    return [{ ...row, top_category: topCat[0]?.top_category ?? null }];
  },
};

export default favoritesRepository;
