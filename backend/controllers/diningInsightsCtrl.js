/**
 * @file diningInsightsCtrl.js
 * @module controllers/diningInsightsCtrl
 *
 * @description
 * Handles data aggregation and AI-generated narrative insights for a user's
 * dining activity on MunchMate.
 *
 * **Architectural role:**
 * Sits in the controller layer — reads aggregated click and spending data from
 * the repository layer, optionally enriches it through the AI service, and
 * returns a shaped response. Contains no raw SQL and no direct DB imports.
 *
 * **Endpoints served:**
 * | Handler               | Route                        | Purpose                                          |
 * |-----------------------|------------------------------|--------------------------------------------------|
 * | `diningInsightsCtrl`  | GET /insights/dining         | Weekly activity counts, trend, top cuisine/price |
 * | `getSpendingInsights` | GET /insights/spending       | Spend totals + AI-generated summary narrative    |
 *
 * **Dependencies:**
 * - `repositories/userClicksRepository` — weekly click counts, top price range, top cuisine
 * - `repositories/favoritesRepository`  — aggregated spend summary from saved restaurants
 * - `services/aiService`                — generates a natural-language spending summary
 * - `utils/responseHandler`             — standardised JSON response helpers
 *
 * @example <caption>Quick Start — registered routes that map to this controller</caption>
 * ```js
 * import { diningInsightsCtrl, getSpendingInsights } from '../controllers/diningInsightsCtrl.js';
 *
 * router.get('/insights/dining',   authMiddleware, diningInsightsCtrl);
 * router.get('/insights/spending', authMiddleware, getSpendingInsights);
 * ```
 */

import { sendError, sendSuccess } from '../utils/responseHandler.js';
import favoritesRepository from '../repositories/favoritesRepository.js';
import userClicksRepository from '../repositories/userClicksRepository.js';
import { generateSpendingSummary } from '../services/aiService.js';

/**
 * Aggregates a user's weekly restaurant-click activity and surfaces their most
 * common price range and cuisine type.
 *
 * All four repository queries run concurrently via `Promise.all` to minimise
 * total latency — each is an independent DB read with no inter-dependency.
 *
 * **Complexity:** O(1) time from the controller's perspective; the DB queries
 * each perform a full scan filtered by `user_id` — performance is determined
 * by the index on `user_clicks.user_id` and `clicked_at`.
 *
 * @async
 * @param {import('express').Request}  req - Express request object.
 * @param {Object} req.user           - Populated by auth middleware.
 * @param {number} req.user.userId    - The authenticated user's primary key.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends a 200 JSON response with the shape:
 * ```json
 * {
 *   "thisWeek":     7,
 *   "lastWeek":     4,
 *   "trend":        "up",
 *   "topPriceRange": "$$",
 *   "topCuisine":   "Mexican"
 * }
 * ```
 * `trend` is one of `"up"`, `"down"`, or `"same"`.
 * `topPriceRange` and `topCuisine` are `null` when there is insufficient click history.
 * Sends 500 on any unexpected error.
 *
 * @throws Will call `sendError(res, ..., 500)` if any repository query rejects.
 */
export const diningInsightsCtrl = async (req, res) => {
  const userId = req.user.userId;
  try {
    // Run all four reads in parallel — none depends on another's result.
    const [[thisWeekRow], [lastWeekRow], topPriceRows, topCuisineRows] = await Promise.all([
      userClicksRepository.getThisWeekCount(userId),
      userClicksRepository.getLastWeekCount(userId),
      userClicksRepository.getTopPriceRange(userId),
      userClicksRepository.getTopCuisine(userId),
    ]);

    const thisWeek = thisWeekRow?.cnt ?? 0;
    const lastWeek = lastWeekRow?.cnt ?? 0;

    // Derive trend direction from raw counts — the UI maps this to an arrow icon.
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

/**
 * Returns aggregated spending data from a user's saved restaurants and an
 * AI-generated narrative summary of their dining habits.
 *
 * Returns `{ hasData: false }` early when the user has no spend data rather
 * than returning zeros — the frontend uses this flag to show an empty state
 * instead of a misleading "$0 spent" card.
 *
 * **Complexity:** O(1) for the DB query (single aggregated row); the AI
 * summary call latency is network-bound and variable (~1–3 s typical).
 *
 * @async
 * @param {import('express').Request}  req - Express request object.
 *   @param {Object} req.user           - Populated by auth middleware.
 *   @param {number} req.user.userId    - The authenticated user's primary key.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends a 200 JSON response. Two possible shapes:
 *
 * No data:
 * ```json
 * { "hasData": false }
 * ```
 *
 * With data:
 * ```json
 * {
 *   "hasData":     true,
 *   "total":       142.50,
 *   "avgPerMeal":  23.75,
 *   "mealCount":   6,
 *   "topCategory": "Italian",
 *   "summary":     "You've been loving Italian this month..."
 * }
 * ```
 * Sends 500 on any unexpected error.
 *
 * @throws Will call `sendError(res, ..., 500)` if the repository query or the
 *   AI service call rejects.
 */
export const getSpendingInsights = async (req, res) => {
  const userId = req.user.userId;
  try {
    const rows = await favoritesRepository.getSpendSummary(userId);

    // Guard against users who have no saved restaurants or no price data yet —
    // returning hasData: false lets the UI render an empty state gracefully.
    if (!rows.length || rows[0].total === null) {
      return sendSuccess(res, { hasData: false });
    }

    const { total, avg_per_meal, meal_count, top_category } = rows[0];

    // Parse DB decimal strings to JS numbers before passing to the AI service
    // so the prompt receives numeric values, not quoted strings.
    const summary = await generateSpendingSummary({
      total: parseFloat(total),
      avgPerMeal: parseFloat(avg_per_meal),
      topCategory: top_category || 'restaurants',
      mealCount: parseInt(meal_count, 10),
    });

    sendSuccess(res, {
      hasData: true,
      total: parseFloat(total),
      avgPerMeal: parseFloat(avg_per_meal),
      mealCount: parseInt(meal_count, 10),
      topCategory: top_category,
      summary,
    });
  } catch (err) {
    console.error('Spending insights error:', err);
    sendError(res, 'Failed to fetch spending insights', 500);
  }
};

export default diningInsightsCtrl;
