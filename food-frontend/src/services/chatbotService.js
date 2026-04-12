/**
 * chatbotService.js — Chatbot API Layer
 *
 * Centralizes all HTTP calls for the MunchMate AI chatbot feature:
 * loading history, sending messages, and clearing sessions.
 *
 * Every function:
 *  - Returns the parsed response body (`response.data`) on success
 *  - Lets Axios errors propagate so callers can handle them with try/catch
 */

import api from "../utils/axiosInstance";
import { ENDPOINTS } from "../utils/apiEndpoints";

/**
 * Retrieves the authenticated user's full chatbot conversation history.
 * Each session contains an array of { userMessage, botResponse } pairs.
 *
 * @returns {Promise<Object>} History payload from the backend
 * @returns {Object[]} .sessions - Array of session objects
 * @returns {Object[]} .sessions[].conversations - Array of message pairs
 */
export const getChatHistory = () =>
  api.get(ENDPOINTS.CHATBOT.HISTORY).then((res) => res.data);

/**
 * Sends a user message to the MunchMate AI and returns its response.
 *
 * @param {Object} payload              - Message payload
 * @param {string} payload.message      - The user's natural-language query
 * @param {string} [payload.location]   - User's current city (for context)
 * @param {string} [payload.cuisine]    - User's preferred cuisines (for context)
 * @param {string} [payload.instruction] - System-level instruction hint
 * @returns {Promise<Object>} AI response payload
 * @returns {string} .response - The bot's reply text (may be undefined on error)
 * @returns {string} [.error]  - Error message if the AI could not respond
 */
export const sendMessage = (payload) =>
  api.post(ENDPOINTS.CHATBOT.ASK, payload).then((res) => res.data);

/**
 * Deletes all chatbot conversation history for the authenticated user.
 *
 * @returns {Promise<Object>} Confirmation payload from the backend
 */
export const clearHistory = () =>
  api.delete(ENDPOINTS.CHATBOT.CLEAR).then((res) => res.data);
