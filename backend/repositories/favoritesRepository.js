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
      `SELECT r.*, uf.note, uf.status
       FROM restaurants r
       INNER JOIN user_favorites uf ON r.id = uf.restaurant_id
       WHERE uf.user_id = ?
       ORDER BY uf.saved_at DESC`,
      [userId]
    );
    return normalizeDatabasePlace(rows, backendUrl);
  },

  updateFavorite: (userId, restaurantId, { note, status }) =>
    queryDB(
      `UPDATE user_favorites SET note = ?, status = ? WHERE user_id = ? AND restaurant_id = ?`,
      [note ?? null, status ?? 'want_to_go', userId, restaurantId]
    ),

  isFavorite: async (userId, restaurantId) => {
    const rows = await queryDB(
      'SELECT 1 FROM user_favorites WHERE user_id = ? AND restaurant_id = ?',
      [userId, restaurantId]
    );
    return rows.length > 0;
  },
};

export default favoritesRepository;
