import { queryDB } from '../config/db.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';

const diningInsightsCtrl = async (req, res) => {
  const userId = req.user.userId;
  try {
    const [[thisWeekRow], [lastWeekRow], topPriceRows, topCuisineRows] = await Promise.all([
      queryDB(
        `SELECT COUNT(*) AS cnt FROM user_clicks WHERE user_id = ? AND clicked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId]
      ),
      queryDB(
        `SELECT COUNT(*) AS cnt FROM user_clicks WHERE user_id = ?
         AND clicked_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId]
      ),
      queryDB(
        `SELECT r.price, COUNT(*) AS cnt
         FROM user_clicks uc JOIN restaurants r ON uc.restaurant_id = r.id
         WHERE uc.user_id = ? AND r.price IS NOT NULL
         GROUP BY r.price ORDER BY cnt DESC LIMIT 1`,
        [userId]
      ),
      queryDB(
        `SELECT r.category, COUNT(*) AS cnt
         FROM user_clicks uc JOIN restaurants r ON uc.restaurant_id = r.id
         WHERE uc.user_id = ? AND r.category IS NOT NULL
         GROUP BY r.category ORDER BY cnt DESC LIMIT 1`,
        [userId]
      ),
    ]);

    const thisWeek = thisWeekRow?.cnt ?? 0;
    const lastWeek = lastWeekRow?.cnt ?? 0;
    const trend = thisWeek > lastWeek ? 'up' : thisWeek < lastWeek ? 'down' : 'same';

    sendSuccess(res, {
      thisWeek,
      lastWeek,
      trend,
      topPriceRange: topPriceRows[0]?.price || null,
      topCuisine: topCuisineRows[0]?.category || null,
    });
  } catch (err) {
    console.error('Dining insights error:', err);
    sendError(res, 'Failed to fetch dining insights', 500);
  }
};

export default diningInsightsCtrl;
