/**
 * @file favoritesCtrl.js
 * @module controllers/favoritesCtrl
 *
 * @description
 * Handles all CRUD and spend-tracking operations for a user's saved (favorited)
 * restaurants on MunchMate.
 *
 * **Architectural role:**
 * Sits in the controller layer — validates inputs, delegates persistence to the
 * repository layer, and delegates service-level operations (Google Places caching,
 * input validation) to their respective modules. Contains no raw SQL.
 *
 * **Endpoints served:**
 * | Handler              | Method | Route                                    | Purpose                              |
 * |----------------------|--------|------------------------------------------|--------------------------------------|
 * | `addFavorite`        | POST   | /favorites                               | Save a restaurant; cache if needed   |
 * | `removeFavorite`     | DELETE | /favorites/:restaurantId                 | Remove a saved restaurant            |
 * | `updateFavorite`     | PATCH  | /favorites/:restaurantId                 | Update note, status, or rating       |
 * | `getFavorites`       | GET    | /favorites                               | List all saved restaurants           |
 * | `updateSpend`        | POST   | /favorites/:restaurantId/spend           | Log a spend amount                   |
 * | `getSpendLogs`       | GET    | /favorites/:restaurantId/spend           | Get all spend logs for a restaurant  |
 * | `getVisitedWithSpend`| GET    | /favorites/visited                       | Get visited restaurants with totals  |
 *
 * **Dependencies:**
 * - `repositories/favoritesRepository`        — all favorites DB operations
 * - `repositories/restaurantRepository`       — restaurant cache reads/writes (via service)
 * - `services/restaurantService`              — Google Places cache-or-fetch logic
 * - `utils/validators/favoritesValidator`     — status, rating, and spend validation
 * - `utils/responseHandler`                   — standardised JSON response helpers
 *
 * @example <caption>Quick Start — registered routes that map to this controller</caption>
 * ```js
 * import favoritesCtrl from '../controllers/favoritesCtrl.js';
 *
 * router.post(  '/favorites',                    authMiddleware, favoritesCtrl.addFavorite);
 * router.delete('/favorites/:restaurantId',      authMiddleware, favoritesCtrl.removeFavorite);
 * router.patch( '/favorites/:restaurantId',      authMiddleware, favoritesCtrl.updateFavorite);
 * router.get(   '/favorites',                    authMiddleware, favoritesCtrl.getFavorites);
 * router.post(  '/favorites/:restaurantId/spend',authMiddleware, favoritesCtrl.updateSpend);
 * router.get(   '/favorites/:restaurantId/spend',authMiddleware, favoritesCtrl.getSpendLogs);
 * router.get(   '/favorites/visited',            authMiddleware, favoritesCtrl.getVisitedWithSpend);
 * ```
 */

import { sendError, sendSuccess } from '../utils/responseHandler.js';
import favoritesRepository from '../repositories/favoritesRepository.js';
import { ensureRestaurantCached } from '../services/restaurantService.js';
import { validateFavoriteUpdate, validateSpendAmount } from '../utils/validators/favoritesValidator.js';

/**
 * @namespace favoritesCtrl
 * @description Controller object grouping all favorites route handlers.
 */
const favoritesCtrl = {
  /**
   * Saves a restaurant to the user's favorites, fetching and caching its details
   * from the Google Places API first if they are not already stored locally.
   *
   * The cache-or-fetch step is required before inserting the favorite so that
   * subsequent reads (e.g. `getFavorites`) always have a complete restaurant row
   * — including photo reference — without needing to hit the Places API at read time.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string} req.body.restaurant_id - Google Places ID of the restaurant to save.
   *   @param {Object} req.user              - Populated by auth middleware.
   *   @param {number} req.user.userId       - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 `{ message: 'Added to favorites' }` on success;
   *   400 if `restaurant_id` is missing; 500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the Places API call or any DB
   *   operation fails.
   */
  addFavorite: async (req, res) => {
    const { restaurant_id } = req.body;
    const userId = req.user.userId;

    if (!restaurant_id) return sendError(res, 'Missing restaurant_id', 400);

    try {
      // Guarantee a complete cached row exists before saving as favorite —
      // avoids broken UI states where a favorite has no name or photo.
      await ensureRestaurantCached(restaurant_id);

      await favoritesRepository.addFavorite(userId, restaurant_id);
      sendSuccess(res, { message: 'Added to favorites' });
    } catch (err) {
      console.error('Error adding favorite:', err);
      sendError(res, 'Failed to add favorite', 500);
    }
  },

  /**
   * Removes a restaurant from the user's favorites.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string} req.params.restaurantId - Google Places ID of the restaurant to remove.
   *   @param {Object} req.user               - Populated by auth middleware.
   *   @param {number} req.user.userId        - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 `{ message: 'Removed from favorites' }` on success;
   *   500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB delete fails.
   */
  removeFavorite: async (req, res) => {
    const { restaurantId } = req.params;
    const userId = req.user.userId;
    try {
      await favoritesRepository.removeFavorite(userId, restaurantId);
      sendSuccess(res, { message: 'Removed from favorites' });
    } catch (err) {
      console.error('Error removing favorite:', err);
      sendError(res, 'Failed to remove favorite', 500);
    }
  },

  /**
   * Updates the note, visit status, or personal rating on a saved restaurant.
   *
   * All three fields are optional — only provided fields are applied. Validation
   * is delegated to `favoritesValidator` to keep the controller free of inline
   * guard logic, consistent with the rest of the codebase.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string} req.params.restaurantId       - Google Places ID of the restaurant.
   *   @param {string} [req.body.note]               - Freeform personal note.
   *   @param {string} [req.body.status]             - Visit status: `'want_to_go'` or `'visited'`.
   *   @param {number} [req.body.rating]             - Personal rating; integer between 1 and 5 inclusive.
   *   @param {Object} req.user                      - Populated by auth middleware.
   *   @param {number} req.user.userId               - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 `{ message: 'Favorite updated' }` on success;
   *   400 on invalid `status` or `rating`; 500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB update fails.
   */
  updateFavorite: async (req, res) => {
    const { restaurantId } = req.params;
    const userId = req.user.userId;
    const { note, status, rating } = req.body;

    const { isValid, error } = validateFavoriteUpdate({ status, rating });
    if (!isValid) return sendError(res, error, 400);

    try {
      await favoritesRepository.updateFavorite(userId, restaurantId, { note, status, rating });
      sendSuccess(res, { message: 'Favorite updated' });
    } catch (err) {
      console.error('Error updating favorite:', err);
      sendError(res, 'Failed to update favorite', 500);
    }
  },

  /**
   * Returns all restaurants saved by the user, including photo URLs and metadata.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {Object} req.user           - Populated by auth middleware.
   *   @param {number} req.user.userId    - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 with an array of favorite restaurant objects;
   *   500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB query fails.
   */
  getFavorites: async (req, res) => {
    const userId = req.user.userId;
    const backendUrl = process.env.BACKEND_URL || '';
    try {
      const favorites = await favoritesRepository.getFavorites(userId, backendUrl);
      sendSuccess(res, favorites);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      sendError(res, 'Failed to fetch favorites', 500);
    }
  },

  /**
   * Logs a spend amount against a saved restaurant for expense tracking.
   *
   * Spend validation is delegated to `favoritesValidator`, which also returns
   * the parsed float so the controller never parses the value twice.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string} req.params.restaurantId - Google Places ID of the restaurant.
   *   @param {number} req.body.amount         - Spend amount; must be a non-negative number.
   *   @param {Object} req.user                - Populated by auth middleware.
   *   @param {number} req.user.userId         - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 `{ message: 'Spend logged' }` on success;
   *   400 if `amount` is missing, non-numeric, or negative; 500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB insert fails.
   */
  updateSpend: async (req, res) => {
    const { restaurantId } = req.params;
    const userId = req.user.userId;
    const { amount } = req.body;

    const { isValid, parsed, error } = validateSpendAmount(amount);
    if (!isValid) return sendError(res, error, 400);

    try {
      await favoritesRepository.updateSpend(userId, restaurantId, parsed);
      sendSuccess(res, { message: 'Spend logged' });
    } catch (err) {
      console.error('Error logging spend:', err);
      sendError(res, 'Failed to log spend', 500);
    }
  },

  /**
   * Returns all spend log entries for a specific saved restaurant.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string} req.params.restaurantId - Google Places ID of the restaurant.
   *   @param {Object} req.user                - Populated by auth middleware.
   *   @param {number} req.user.userId         - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 with an array of spend log objects;
   *   500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB query fails.
   */
  getSpendLogs: async (req, res) => {
    const { restaurantId } = req.params;
    const userId = req.user.userId;
    try {
      const logs = await favoritesRepository.getSpendLogs(userId, restaurantId);
      sendSuccess(res, logs);
    } catch (err) {
      console.error('Error fetching spend logs:', err);
      sendError(res, 'Failed to fetch spend logs', 500);
    }
  },

  /**
   * Returns all restaurants the user has marked as `'visited'`, joined with their
   * aggregated spend totals.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {Object} req.user           - Populated by auth middleware.
   *   @param {number} req.user.userId    - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 with an array of visited restaurant objects
   *   including spend aggregates; 500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB query fails.
   */
  getVisitedWithSpend: async (req, res) => {
    const userId = req.user.userId;
    try {
      const rows = await favoritesRepository.getVisitedWithSpend(userId);
      sendSuccess(res, rows);
    } catch (err) {
      console.error('Error fetching visited places:', err);
      sendError(res, 'Failed to fetch visited places', 500);
    }
  },
};

export default favoritesCtrl;
