import { verifyAccessToken } from '../utils/jwtUtils.js';

/**
 * Express Middleware: Soft JWT Authentication Guard.
 *
 * Designed for hybrid routes accessible to both anonymous guests and logged-in users,
 * where behavior might change based on authenticated state (e.g. injecting user preferences).
 *
 * It acts "softly" - if a valid HttpOnly accessToken cookie is present, it decodes and maps it natively 
 * to `req.user`. If the token is missing, malformed, or expired, the request gracefully degrades 
 * and continues without throwing an HTTP 401/403.
 *
 * Downstream controllers simply assess auth state via: `if (req.user) { ... }`
 *
 * @param {Object} req - The Express request object containing potential HttpOnly cookies.
 * @param {Object} res - The Express response object.
 * @param {Function} next - Express next middleware function reference.
 */
const optionalAuthMiddleware = (req, res, next) => {
  // Read the access token from the secure HttpOnly cookie; falls back gracefully if absent
  const token = req.cookies?.accessToken;
  
  if (token) {
    try {
      // Attach user payload if token is cryptographically valid — silently skip if not
      req.user = verifyAccessToken(token); // Yields: { userId, firstName, lastName }
    } catch {
      // Invalid or expired token — treat gracefully as unauthenticated, do not block the request
    }
  }
  
  // Proceed to the endpoint regardless of auth status
  next();
};

export default optionalAuthMiddleware;
