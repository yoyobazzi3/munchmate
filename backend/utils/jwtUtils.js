import jwt from 'jsonwebtoken';

/**
 * Utility Layer: Provides abstract stateless JWT lifecycle generation and decoding 
 * logic for access authorization loops.
 */

/**
 * Issues short-lived access tokens containing heavily scoped non-PII details.
 * Binds payload tightly bridging database column nomenclature to Javascript standard formats.
 * 
 * @param {Object} user - Source object containing target user data.
 * @returns {string} The raw signed JWT encoded string.
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id || user.userId, 
      firstName: user.first_name || user.firstName, 
      lastName: user.last_name || user.lastName 
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

/**
 * Issues durable secondary tokens to silently keep user sessions alive.
 * Purposely strips out identifying attributes and restricts scope purely to the index ID.
 * 
 * @param {number|string} userId - The unique tracking ID natively.
 * @returns {string} The raw signed JWT encoded string.
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Cryptographically verifies an access token utilizing the global ecosystem secret.
 * 
 * @param {string} token - The raw extracted JWT string to test.
 * @returns {Object} The decoded and verified JSON payload mapped internally.
 * @throws Will instantly crash/throw if signature, algorithm, or dates are structurally invalid.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
