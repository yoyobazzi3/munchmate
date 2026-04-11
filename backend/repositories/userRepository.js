/**
 * userRepository.js — Database Access Layer for Users & Preferences
 *
 * All SQL queries related to the `users` and `user_preferences` tables
 * live here. Controllers should NEVER write raw SQL — they call these
 * functions instead.
 *
 * Benefits:
 *  - If the database schema changes, only this file needs updating
 *  - SQL is easy to find, review, and test in one place
 *  - Controllers stay clean and focused on HTTP logic
 */

import pool, { queryDB } from '../config/db.js';

const userRepository = {
  /**
   * Find a user by their email address.
   * Used during login to verify credentials.
   * @param {string} email
   * @returns {Array} Array of matching user rows
   */
  findByEmail: (email) =>
    queryDB(
      'SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ?',
      [email]
    ),

  /**
   * Find a user by their ID.
   * Used during token refresh to confirm the user still exists.
   * @param {number} userId
   * @returns {Array} Array of matching user rows
   */
  findById: (userId) =>
    queryDB(
      'SELECT id, first_name, last_name FROM users WHERE id = ?',
      [userId]
    ),

  /**
   * Insert a new user into the database.
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} email
   * @param {string} hashedPassword
   * @returns {object} MySQL result object (includes insertId)
   */
  createUser: (firstName, lastName, email, hashedPassword) =>
    queryDB(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword]
    ),

  /**
   * Create the initial preferences row for a new user after signup.
   * @param {number} userId
   * @param {string} favoriteCuisines - JSON-stringified array
   * @param {string} priceRange - e.g. "$$"
   */
  createPreferences: (userId, favoriteCuisines, priceRange) =>
    queryDB(
      'INSERT INTO user_preferences (user_id, favorite_cuisines, preferred_price_range) VALUES (?, ?, ?)',
      [userId, favoriteCuisines, priceRange]
    ),

  /**
   * Get a user's food preferences (cuisines, price range, liked/disliked foods).
   * @param {number} userId
   * @returns {Array} Matching preferences rows
   */
  getPreferences: (userId) =>
    queryDB(
      'SELECT favorite_cuisines, preferred_price_range FROM user_preferences WHERE user_id = ?',
      [userId]
    ),

  /**
   * Get a user's liked and disliked foods — used by the chatbot to personalize prompts.
   * @param {number} userId
   * @returns {Array} Matching preferences rows
   */
  getChatbotPreferences: async (userId) => {
    const [rows] = await pool.query(
      'SELECT liked_foods, disliked_foods FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    return rows;
  },

  /**
   * Upsert a user's preferences (insert or update if already exists).
   * @param {number} userId
   * @param {string} favoriteCuisines - JSON-stringified array
   * @param {string} preferredPriceRange - e.g. "$$"
   */
  upsertPreferences: (userId, favoriteCuisines, preferredPriceRange) =>
    queryDB(
      `INSERT INTO user_preferences (user_id, favorite_cuisines, preferred_price_range)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         favorite_cuisines = VALUES(favorite_cuisines),
         preferred_price_range = VALUES(preferred_price_range)`,
      [userId, favoriteCuisines, preferredPriceRange]
    ),
};

export default userRepository;
