/**
 * @file chatbotCtrl.js
 * @module controllers/chatbotCtrl
 *
 * @description
 * Handles user interactions with the MunchMate AI dining assistant.
 *
 * **Architectural role:**
 * Sits in the controller layer — orchestrates input validation, user preference
 * fetching, prompt construction, LLM generation, conversation persistence, and
 * silent preference learning. All persistence is delegated to the repository
 * layer; all AI operations are delegated to the AI service.
 *
 * **Request pipeline (in order):**
 * 1. Validate the incoming message
 * 2. Fetch the user's long-term food preferences from the DB
 * 3. Build a personalised prompt from the message + context + preferences
 * 4. Call the LLM and await its response
 * 5. Persist the exchange to the user's chat history
 * 6. Silently extract any newly expressed food preferences and merge them into the user's profile
 * 7. Return the AI response to the client
 *
 * **Dependencies:**
 * - `utils/validators/chatValidator`  — message payload validation
 * - `utils/responseHandler`           — standardised JSON response helpers
 * - `services/aiService`              — prompt building, LLM generation, preference extraction
 * - `repositories/userRepository`     — user preference reads and writes
 * - `repositories/chatRepository`     — conversation history persistence
 *
 * @example <caption>Quick Start — registered route that maps to this controller</caption>
 * ```js
 * import chatbotCtrl from '../controllers/chatbotCtrl.js';
 *
 * router.post('/chatbot/chat', authMiddleware, chatbotCtrl.chat);
 * ```
 */

import { validateChatMessage } from "../utils/validators/chatValidator.js";
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { buildPrompt, generateChatResponse, extractPreferences } from "../services/aiService.js";
import userRepository from "../repositories/userRepository.js";
import chatRepository from "../repositories/chatRepository.js";

/**
 * @namespace chatbotCtrl
 * @description Controller object grouping all chatbot route handlers.
 */
const chatbotCtrl = {
  /**
   * Processes a user chat message, generates an AI dining recommendation, persists
   * the exchange, and silently updates the user's food preference profile.
   *
   * Preference extraction runs in a nested try/catch and never blocks the response —
   * if the extraction LLM call fails, the user still receives their chat reply and
   * the error is swallowed silently. This is intentional: preference learning is
   * a best-effort background enhancement, not a core feature of the endpoint.
   *
   * **Complexity:** O(1) for all DB operations (single-row reads/writes);
   * O(p) for preference deduplication where p is the number of existing
   * liked/disliked food strings — bounded in practice and effectively O(1).
   * Total latency is dominated by the LLM network call (~1–5 s typical).
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string}  req.body.message     - The user's chat message. Required; must be non-empty.
   *   @param {string}  [req.body.location]  - Optional location context (city or neighbourhood).
   *   @param {string}  [req.body.cuisine]   - Optional cuisine filter (e.g. "Italian", "Sushi").
   *   @param {string}  [req.body.dietary]   - Optional dietary restriction (e.g. "vegan", "halal").
   *   @param {string}  [req.body.instruction] - Optional freeform instruction to steer the AI.
   *   @param {Object}  req.user             - Populated by auth middleware.
   *   @param {number}  req.user.userId      - The authenticated user's primary key.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends a 200 JSON response on success:
   * ```json
   * {
   *   "response": "Here are some great Italian spots near you...",
   *   "preferencesUpdated": true
   * }
   * ```
   * `preferencesUpdated` is `true` when new liked or disliked foods were extracted
   * from the message and merged into the user's profile; `false` otherwise.
   * Sends 400 if message validation fails; 500 on any unexpected error.
   *
   * @throws Will call `sendError(res, ..., 500)` if the LLM call or any repository
   *   operation rejects. In development, the raw error message is surfaced; in
   *   production a generic message is returned to avoid leaking internals.
   */
  chat: async (req, res) => {
    try {
      const { message, location, cuisine, dietary, instruction } = req.body;

      const validation = validateChatMessage(message);
      if (!validation.isValid) {
        return sendError(res, validation.error, 400);
      }

      const userId = req.user.userId;

      // Fetch long-term preferences to personalise the prompt — fall back to empty
      // strings so buildPrompt can handle a new user with no preference history.
      const [prefsRow] = await userRepository.getChatbotPreferences(userId);
      const preferences = prefsRow ?? { liked_foods: '', disliked_foods: '' };

      const prompt = buildPrompt(message, { location, cuisine, dietary, instruction }, preferences);

      const responseText = await generateChatResponse(prompt);

      // Persist before returning so the chat history tab is always in sync,
      // even if the client disconnects immediately after receiving the response.
      await chatRepository.saveConversation(userId, message, responseText);

      // Preference extraction is fire-and-forget from the user's perspective.
      // The inner try/catch ensures a failed extraction never fails the request.
      let preferencesUpdated = false;
      try {
        const extracted = await extractPreferences(message);
        if (extracted.liked.length || extracted.disliked.length) {
          // Use Sets to deduplicate against the user's existing preferences before
          // writing — prevents "pizza, pizza, pizza" accumulating over time.
          const existingLiked    = new Set((preferences.liked_foods    || '').split(',').map(s => s.trim()).filter(Boolean));
          const existingDisliked = new Set((preferences.disliked_foods || '').split(',').map(s => s.trim()).filter(Boolean));

          extracted.liked.forEach(item    => existingLiked.add(item.toLowerCase().trim()));
          extracted.disliked.forEach(item => existingDisliked.add(item.toLowerCase().trim()));

          await userRepository.updateLikedDislikedFoods(
            userId,
            [...existingLiked].join(', '),
            [...existingDisliked].join(', ')
          );
          preferencesUpdated = true;
        }
      } catch {
        // Swallow extraction errors — preference learning must never degrade the chat UX.
      }

      return sendSuccess(res, { response: responseText, preferencesUpdated });
    } catch (error) {
      console.error("Chatbot Error:", error);

      // Expose the raw error in development to aid debugging; return a safe
      // generic message in production to avoid leaking stack traces or API details.
      const errorMessage = process.env.NODE_ENV === 'development'
        ? error.message
        : "Failed to generate response";

      return sendError(res, errorMessage, 500);
    }
  },
};

export default chatbotCtrl;
