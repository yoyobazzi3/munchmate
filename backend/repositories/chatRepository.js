/**
 * chatRepository.js — Database Access Layer for Chat Conversations
 *
 * All SQL queries related to the `chatbot_conversations` table live here.
 * Controllers call these functions instead of writing raw SQL inline.
 */

import pool from '../config/db.js';

const chatRepository = {
  /**
   * Save a new chatbot message + response pair to the database.
   * Called after every successful AI response.
   * @param {number} userId
   * @param {string} message  - The user's message
   * @param {string} response - The AI's response
   */
  saveConversation: (userId, message, response) =>
    pool.query(
      'INSERT INTO chatbot_conversations (userID, message, response) VALUES (?, ?, ?)',
      [userId, message, response]
    ),

  /**
   * Retrieve the 50 most recent conversations for a user, newest first.
   * Returns formatted_date for display grouping by day.
   * @param {number} userId
   * @returns {Array} Array of conversation rows
   */
  getHistory: (userId) =>
    pool.query(
      `SELECT
          id,
          message,
          response,
          UNIX_TIMESTAMP(timestamp) as timestamp,
          DATE_FORMAT(timestamp, '%W, %M %e %Y at %l:%i %p') as formatted_date
       FROM chatbot_conversations
       WHERE userID = ?
       ORDER BY timestamp DESC
       LIMIT 50`,
      [userId]
    ),

  /**
   * Delete all conversation history for a user.
   * @param {number} userId
   */
  clearHistory: (userId) =>
    pool.query(
      'DELETE FROM chatbot_conversations WHERE userID = ?',
      [userId]
    ),
};

export default chatRepository;
