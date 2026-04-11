import { queryDB } from '../config/db.js';

/**
 * Repository: Chat Database Access Layer
 *
 * Dedicated repository handling all MySQL queries tied to the `chatbot_conversations` table.
 * All controllers interface solely with these abstracted methods instead of running inline SQL.
 */
const chatRepository = {
  /**
   * Persists a new chatbot prompt and response pair to the database history.
   * 
   * @param {number} userId - The authenticated user's ID.
   * @param {string} message - The original processed question/message from the user.
   * @param {string} response - The generated response text returned by the AI.
   * @returns {Promise<Array>} The query execution result metadata.
   */
  saveConversation: (userId, message, response) =>
    queryDB(
      'INSERT INTO chatbot_conversations (userID, message, response) VALUES (?, ?, ?)',
      [userId, message, response]
    ),

  /**
   * Retrieves up to the 50 most recent conversations for a specified user dynamically.
   * Formats the `timestamp` explicitly into a string locally inside MySQL.
   * 
   * @param {number} userId - The unique identifier of the target user.
   * @returns {Promise<Array>} A flat array of mapped conversational rows.
   */
  getHistory: (userId) =>
    queryDB(
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
   * Permanently clears all recorded AI conversation history for a distinct user.
   * 
   * @param {number} userId - The authenticated user's target ID.
   * @returns {Promise<Array>} The query execution result metadata.
   */
  clearHistory: (userId) =>
    queryDB(
      'DELETE FROM chatbot_conversations WHERE userID = ?',
      [userId]
    ),
};

export default chatRepository;
