/**
 * @file tasteProfileCtrl.js
 * @module controllers/tasteProfileCtrl
 *
 * @description
 * Generates a natural-language taste profile for the authenticated user by
 * passing their personally rated favorites to an LLM and returning the insight.
 *
 * **Architectural role:**
 * Sits in the controller layer — fetches data from the repository layer and
 * delegates AI generation to the service layer. The controller itself is
 * intentionally thin: all prompt construction and LLM interaction live in
 * `aiService.generateInsightFromRatings`. Contains no raw SQL.
 *
 * **Endpoints served:**
 * | Handler              | Method | Route           | Purpose                            |
 * |----------------------|--------|-----------------|------------------------------------|
 * | `tasteProfileCtrl`   | GET    | /taste-profile  | Generate an AI taste profile insight |
 *
 * **Dependencies:**
 * - `repositories/favoritesRepository`  — fetches the user's rated favorites
 * - `services/aiService`                — `generateInsightFromRatings` LLM call
 * - `utils/responseHandler`             — standardised JSON response helpers
 *
 * @example <caption>Quick Start — registered route that maps to this controller</caption>
 * ```js
 * import tasteProfileCtrl from '../controllers/tasteProfileCtrl.js';
 *
 * router.get('/taste-profile', authMiddleware, tasteProfileCtrl);
 * ```
 */

import { sendError, sendSuccess } from '../utils/responseHandler.js';
import favoritesRepository from '../repositories/favoritesRepository.js';
import { generateInsightFromRatings } from '../services/aiService.js';

/**
 * Fetches the user's rated favorites, runs them through the LLM insight
 * generator, and returns the resulting taste profile as a natural-language string.
 *
 * The response includes `ratingCount` so the client can display a confidence
 * indicator — a profile built from 1 rating is less reliable than one built
 * from 20, and the UI can communicate that nuance without making an extra request.
 *
 * If the user has no rated favorites, `ratedFavorites` will be an empty array.
 * `generateInsightFromRatings` is expected to handle this gracefully (e.g. by
 * returning a prompt encouraging the user to rate more restaurants).
 *
 * **Complexity:** O(r) where r is the number of rated favorites passed to the
 * LLM prompt. Total latency is dominated by the LLM network call (~1–5 s typical).
 *
 * @async
 * @param {import('express').Request}  req - Express request object.
 *   @param {Object} req.user        - Populated by auth middleware.
 *   @param {number} req.user.userId - The authenticated user's primary key.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends 200 with:
 * ```json
 * {
 *   "insight": "You tend to gravitate toward bold, spicy flavours...",
 *   "ratingCount": 7
 * }
 * ```
 * Sends 500 on any unexpected error.
 *
 * @throws Will call `sendError(res, ..., 500)` if the DB query or the LLM call fails.
 */
const tasteProfileCtrl = async (req, res) => {
  const userId = req.user.userId;
  try {
    const ratedFavorites = await favoritesRepository.getRatedFavorites(userId);
    const insight = await generateInsightFromRatings(ratedFavorites);
    sendSuccess(res, { insight, ratingCount: ratedFavorites.length });
  } catch (err) {
    console.error('Taste profile error:', err);
    sendError(res, 'Failed to generate taste profile', 500);
  }
};

export default tasteProfileCtrl;
