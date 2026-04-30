/**
 * @file getChatHistoryCtrl.js
 * @module controllers/getChatHistoryCtrl
 *
 * @description
 * Handles retrieval and deletion of a user's AI chatbot conversation history.
 *
 * **Architectural role:**
 * Sits in the controller layer — validates the authenticated user, delegates
 * persistence to the repository layer, and delegates session grouping to the
 * formatter utility. Contains no raw SQL.
 *
 * **Endpoints served:**
 * | Handler          | Method | Route               | Purpose                                |
 * |------------------|--------|---------------------|----------------------------------------|
 * | `getChatHistory` | GET    | /chatbot/history    | Fetch grouped history (last 50 msgs)   |
 * | `clearHistory`   | DELETE | /chatbot/history    | Permanently delete all history         |
 *
 * **Dependencies:**
 * - `repositories/chatRepository`    — raw conversation reads and deletes
 * - `utils/chatFormatter`            — groups flat DB rows into dated sessions
 * - `utils/responseHandler`          — standardised JSON response helpers
 *
 * @example <caption>Quick Start — registered routes that map to this controller</caption>
 * ```js
 * import getChatHistoryCtrl from '../controllers/getChatHistoryCtrl.js';
 *
 * router.get(   '/chatbot/history', authMiddleware, getChatHistoryCtrl.getChatHistory);
 * router.delete('/chatbot/history', authMiddleware, getChatHistoryCtrl.clearHistory);
 * ```
 */

import chatRepository from '../repositories/chatRepository.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { groupConversationsBySession } from '../utils/chatFormatter.js';

/**
 * @namespace getChatHistoryCtrl
 * @description Controller object grouping all chat history route handlers.
 */
const getChatHistoryCtrl = {
  /**
   * Returns the user's most recent chat conversations, grouped into dated sessions.
   *
   * The raw DB result is a flat list of `(user_message, ai_response, created_at)`
   * rows. `groupConversationsBySession` folds them into an array of `{ date, messages }`
   * objects so the client can render a timeline without doing any grouping itself.
   *
   * **Complexity:** O(n) where n ≤ 50 (the repository hard-caps the result set).
   * Grouping iterates the list once; all DB operations are O(1) index lookups.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {Object} req.user        - Populated by auth middleware.
   *   @param {number} req.user.userId - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 with:
   * ```json
   * {
   *   "total": 42,
   *   "sessions": [
   *     { "date": "2025-04-22", "messages": [...] }
   *   ]
   * }
   * ```
   * `total` is the raw count before grouping; `sessions` is the grouped result.
   * Sends 500 on any unexpected error — raw message in development, generic in production.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB query or formatter fails.
   */
  getChatHistory: async (req, res) => {
    try {
      const userId = req.user.userId;

      const conversations = await chatRepository.getHistory(userId);

      // Group flat DB rows into dated sessions — avoids forcing the client
      // to implement grouping logic that belongs on the server.
      const structuredSessions = groupConversationsBySession(conversations);

      return sendSuccess(res, {
        total: conversations.length,
        sessions: structuredSessions,
      });
    } catch (error) {
      console.error('Chat History Error:', error);
      const errorMessage = process.env.NODE_ENV === 'development'
        ? error.message
        : 'Failed to retrieve chat history';
      return sendError(res, errorMessage, 500);
    }
  },

  /**
   * Permanently deletes all chat history for the authenticated user.
   *
   * This is a hard delete — there is no soft-delete or recovery path. The
   * operation is scoped strictly to the requesting user's rows, so it cannot
   * affect other users even if called concurrently.
   *
   * **Complexity:** O(n) for the DELETE where n is the number of stored messages —
   * bounded by the 50-row cap on the read side but uncapped on the write side
   * (older messages below the read cap still get deleted).
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {Object} req.user        - Populated by auth middleware.
   *   @param {number} req.user.userId - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 `{ message: 'Chat history cleared successfully.' }` on success;
   *   500 on any unexpected error — raw message in development, generic in production.
   *
   * @throws Will call `sendError(res, ..., 500)` if the DB delete fails.
   */
  clearHistory: async (req, res) => {
    try {
      const userId = req.user.userId;

      await chatRepository.clearHistory(userId);

      return sendSuccess(res, { message: 'Chat history cleared successfully.' });
    } catch (error) {
      console.error('Clear History Error:', error);
      const errorMessage = process.env.NODE_ENV === 'development'
        ? error.message
        : 'Failed to clear chat history';
      return sendError(res, errorMessage, 500);
    }
  },
};

export default getChatHistoryCtrl;
