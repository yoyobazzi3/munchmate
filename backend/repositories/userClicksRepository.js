import { queryDB } from '../config/db.js';

const userClicksRepository = {
  getThisWeekCount: (userId) =>
    queryDB(
      `SELECT COUNT(*) AS cnt FROM user_clicks WHERE user_id = ? AND clicked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId]
    ),

  getLastWeekCount: (userId) =>
    queryDB(
      `SELECT COUNT(*) AS cnt FROM user_clicks WHERE user_id = ?
       AND clicked_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId]
    ),

  getTopPriceRange: (userId) =>
    queryDB(
      `SELECT r.price, COUNT(*) AS cnt
       FROM user_clicks uc JOIN restaurants r ON uc.restaurant_id = r.id
       WHERE uc.user_id = ? AND r.price IS NOT NULL
       GROUP BY r.price ORDER BY cnt DESC LIMIT 1`,
      [userId]
    ),

  getTopCuisine: (userId) =>
    queryDB(
      `SELECT r.category, COUNT(*) AS cnt
       FROM user_clicks uc JOIN restaurants r ON uc.restaurant_id = r.id
       WHERE uc.user_id = ? AND r.category IS NOT NULL
       GROUP BY r.category ORDER BY cnt DESC LIMIT 1`,
      [userId]
    ),
};

export default userClicksRepository;
