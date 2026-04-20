import { queryDB } from '../config/db.js';

/**
 * Repository: User Profiles & Preferences Data Access Layer
 *
 * Exclusively handles MySQL interactions tied to core `users` and `user_preferences` tables.
 * Controllers should invoke these abstracted strategies to isolate underlying schema structures.
 */
const userRepository = {
  /**
   * Retrieves a strict subset of user data keyed by an email address.
   * Leveraged principally by the authentication controller to verify login boundaries.
   * 
   * @param {string} email - The target user's email address.
   * @returns {Promise<Array>} Data response containing hashed secrets natively.
   */
  findByEmail: (email) =>
    queryDB(
      'SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ?',
      [email]
    ),

  /**
   * Targets a user purely by identity index. 
   * Utilized primarily during JWT refresh cycles to authenticate continuity.
   * 
   * @param {number} userId - The target user's primary integer ID.
   * @returns {Promise<Array>} Flat user row array isolating PII.
   */
  findById: (userId) =>
    queryDB(
      'SELECT id, first_name, last_name FROM users WHERE id = ?',
      [userId]
    ),

  /**
   * Finalizes the storage phase of user registration creating a root identity structure.
   * 
   * @param {string} firstName - Captured first name.
   * @param {string} lastName - Captured last name.
   * @param {string} email - Validated email address.
   * @param {string} hashedPassword - One-way cryptographic hashed secret boundary.
   * @returns {Promise<Object>} Execution footprint (contains resulting insertId).
   */
  createUser: (firstName, lastName, email, hashedPassword) =>
    queryDB(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword]
    ),

  /**
   * Bootstraps the baseline preference structure immediately after user origination.
   * 
   * @param {number} userId - The parent user ID to map foreign keys to.
   * @param {string} favoriteCuisines - Stringified JSON tracking category metrics.
   * @param {string} priceRange - A pricing abstraction bounding mapping e.g. "$$".
   * @returns {Promise<Object>} The query execution result metadata.
   */
  createPreferences: (userId, favoriteCuisines, priceRange) =>
    queryDB(
      'INSERT INTO user_preferences (user_id, favorite_cuisines, preferred_price_range) VALUES (?, ?, ?)',
      [userId, favoriteCuisines, priceRange]
    ),

  /**
   * Retrieves overarching profile-level behavioral tags used primarily for generic restaurant filtration.
   * 
   * @param {number} userId - The target user's identifier.
   * @returns {Promise<Array>} Subset row targeting cuisines and active price ranges structurally.
   */
  getPreferences: (userId) =>
    queryDB(
      'SELECT favorite_cuisines, preferred_price_range, liked_foods, disliked_foods FROM user_preferences WHERE user_id = ?',
      [userId]
    ),

  /**
   * Fetches deep granular textual flags (liked vs disliked items) meant exclusively to
   * contextualize the AI Chatbot's overarching recommendation constraints during prompt building.
   * 
   * @param {number} userId - The target user's identifier.
   * @returns {Promise<Array>} A shallow isolation of boolean/text array values parsing food types natively.
   */
  getChatbotPreferences: (userId) =>
    queryDB(
      'SELECT liked_foods, disliked_foods FROM user_preferences WHERE user_id = ?',
      [userId]
    ),

  /**
   * Fuses existing user settings seamlessly over older entries.
   * Defaults gracefully to new table instantiation if none natively existed before.
   * 
   * @param {number} userId - The primary tracking index ID securely provided by the token payload.
   * @param {string} favoriteCuisines - Freshly stringified JSON containing cuisine array tags.
   * @param {string} preferredPriceRange - Target monetary abstraction boundary (e.g "$$$").
   * @returns {Promise<Object>} The query execution result metadata footprint natively.
   */
  upsertPreferences: (userId, favoriteCuisines, preferredPriceRange, likedFoods, dislikedFoods) =>
    queryDB(
      `INSERT INTO user_preferences (user_id, favorite_cuisines, preferred_price_range, liked_foods, disliked_foods)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         favorite_cuisines = VALUES(favorite_cuisines),
         preferred_price_range = VALUES(preferred_price_range),
         liked_foods = VALUES(liked_foods),
         disliked_foods = VALUES(disliked_foods)`,
      [userId, favoriteCuisines, preferredPriceRange, likedFoods ?? null, dislikedFoods ?? null]
    ),

  updateLikedDislikedFoods: (userId, likedFoods, dislikedFoods) =>
    queryDB(
      `UPDATE user_preferences SET liked_foods = ?, disliked_foods = ? WHERE user_id = ?`,
      [likedFoods, dislikedFoods, userId]
    ),

  findByEmailWithReset: (email) =>
    queryDB(
      'SELECT id, email, password_hash, reset_code, reset_code_expires FROM users WHERE email = ?',
      [email]
    ),

  setResetCode: (email, hashedCode, expires) =>
    queryDB(
      'UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE email = ?',
      [hashedCode, expires, email]
    ),

  clearResetCode: (userId) =>
    queryDB(
      'UPDATE users SET reset_code = NULL, reset_code_expires = NULL WHERE id = ?',
      [userId]
    ),

  updatePassword: (userId, hashedPassword) =>
    queryDB(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    ),
};

export default userRepository;
