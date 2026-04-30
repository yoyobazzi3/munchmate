/**
 * @file preferencesCtrl.js
 * @module controllers/preferencesCtrl
 *
 * @description
 * Handles reading and writing a user's long-term dining preferences — favourite
 * cuisines, preferred price range, and liked/disliked foods.
 *
 * **Architectural role:**
 * Sits in the controller layer — validates inputs, delegates persistence to the
 * repository layer, and handles the camelCase ↔ snake_case mapping between the
 * API surface and the DB schema. Contains no raw SQL.
 *
 * **Endpoints served:**
 * | Handler             | Method | Route          | Purpose                           |
 * |---------------------|--------|----------------|-----------------------------------|
 * | `getPreferences`    | GET    | /preferences   | Fetch the user's saved preferences |
 * | `updatePreferences` | PUT    | /preferences   | Upsert the user's preferences      |
 *
 * **Dependencies:**
 * - `repositories/userRepository`              — preference reads and upserts
 * - `utils/validators/preferencesValidator`    — payload type and boundary checks
 * - `utils/responseHandler`                    — standardised JSON response helpers
 *
 * @example <caption>Quick Start — registered routes that map to this controller</caption>
 * ```js
 * import preferencesCtrl from '../controllers/preferencesCtrl.js';
 *
 * router.get('/preferences', authMiddleware, preferencesCtrl.getPreferences);
 * router.put('/preferences', authMiddleware, preferencesCtrl.updatePreferences);
 * ```
 */

import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { validatePreferencesPayload } from '../utils/validators/preferencesValidator.js';
import userRepository from '../repositories/userRepository.js';

/**
 * @namespace preferencesCtrl
 * @description Controller object grouping all preference route handlers.
 */
const preferencesCtrl = {
  /**
   * Returns the authenticated user's saved dining preferences.
   *
   * If no preference row exists yet (first-time user), an empty default object
   * is returned rather than a 404 — the client can treat this as a blank slate
   * without needing to handle a missing-resource error.
   *
   * `favorite_cuisines` is stored as a JSON string in MySQL and must be parsed
   * at read time. The `typeof` guard handles the edge case where the ORM or a
   * future migration returns a pre-parsed array instead of a string.
   *
   * **Complexity:** O(1) — single-row primary-key lookup; JSON.parse is O(k)
   * where k is the number of stored cuisines, bounded in practice.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {Object} req.user        - Populated by auth middleware.
   *   @param {number} req.user.userId - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 with:
   * ```json
   * {
   *   "favoriteCuisines": ["Italian", "Sushi"],
   *   "preferredPriceRange": "$$",
   *   "likedFoods": "pizza, ramen",
   *   "dislikedFoods": "olives"
   * }
   * ```
   * Returns the same shape with empty defaults if no preferences have been saved.
   * Sends 500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB query fails.
   */
  getPreferences: async (req, res) => {
    try {
      const rows = await userRepository.getPreferences(req.user.userId);

      // First-time user — return empty defaults rather than a 404 so the
      // client doesn't need to handle a missing-resource error state.
      if (!rows.length) {
        return sendSuccess(res, { favoriteCuisines: [], preferredPriceRange: '', likedFoods: '', dislikedFoods: '' });
      }

      const { favorite_cuisines, preferred_price_range, liked_foods, disliked_foods } = rows[0];

      // favorite_cuisines is stored as a JSON string in MySQL; parse it at read
      // time. The typeof guard handles a pre-parsed array if the driver ever changes.
      const cuisines = typeof favorite_cuisines === 'string'
        ? JSON.parse(favorite_cuisines || '[]')
        : (favorite_cuisines || []);

      sendSuccess(res, {
        favoriteCuisines: cuisines,
        preferredPriceRange: preferred_price_range || '',
        likedFoods: liked_foods || '',
        dislikedFoods: disliked_foods || '',
      });
    } catch (error) {
      console.error('Fetch preferences error:', error);
      sendError(res, 'Failed to retrieve preferences', 500);
    }
  },

  /**
   * Creates or updates the authenticated user's dining preferences (upsert).
   *
   * `favoriteCuisines` is serialised to a JSON string before the DB write so it
   * can be stored in a plain `TEXT` / `VARCHAR` column without requiring a
   * separate junction table. `getPreferences` deserialises it on read.
   *
   * The operation is an upsert (INSERT … ON DUPLICATE KEY UPDATE in MySQL), so
   * it is safe to call regardless of whether a preference row already exists.
   *
   * **Complexity:** O(1) — single-row upsert; JSON.stringify is O(k) where k is
   * the number of cuisines in the array, bounded in practice.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string[]} [req.body.favoriteCuisines]  - Array of cuisine names.
   *   @param {string}   [req.body.preferredPriceRange] - Price range string (e.g. `'$$'`).
   *   @param {string}   [req.body.likedFoods]         - Comma-separated liked food strings.
   *   @param {string}   [req.body.dislikedFoods]      - Comma-separated disliked food strings.
   *   @param {Object}   req.user                      - Populated by auth middleware.
   *   @param {number}   req.user.userId               - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 with the saved preference values plus
   *   `{ message: 'Preferences saved successfully.' }` on success;
   *   400 on validation failure; 500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB upsert fails.
   */
  updatePreferences: async (req, res) => {
    try {
      const validation = validatePreferencesPayload(req.body);
      if (!validation.isValid) return sendError(res, validation.error, 400);

      const { favoriteCuisines, preferredPriceRange, likedFoods, dislikedFoods } = req.body;

      // Serialise the array to JSON for storage in a plain text column.
      // getPreferences deserialises it with JSON.parse on every read.
      await userRepository.upsertPreferences(
        req.user.userId,
        JSON.stringify(favoriteCuisines || []),
        preferredPriceRange ?? '',
        likedFoods ?? '',
        dislikedFoods ?? ''
      );

      sendSuccess(res, {
        favoriteCuisines: favoriteCuisines || [],
        preferredPriceRange: preferredPriceRange ?? '',
        likedFoods: likedFoods ?? '',
        dislikedFoods: dislikedFoods ?? '',
        message: 'Preferences saved successfully.',
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      sendError(res, 'Failed to update preferences', 500);
    }
  },
};

export default preferencesCtrl;
