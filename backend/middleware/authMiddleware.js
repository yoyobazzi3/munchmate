import { verifyAccessToken } from '../utils/jwtUtils.js';
import { sendError } from '../utils/responseHandler.js';

/**
 * Express Middleware: JWT Authentication Guard.
 *
 * Protects routes that require a fully authenticated user.
 * It reliably extracts the JWT access token from the secure HttpOnly cookies, verifies 
 * the signature using the utility, and decisively attaches the fully decoded user payload 
 * natively to the `req.user` object for any downstream controllers to consume safely.
 *
 * If the token is missing, expired, or invalid, the request is rejected immediately
 * (returning 401 or 403) before the request ever reaches any core controller logic.
 *
 * @param {Object} req - The Express request object, which must contain cookies.
 * @param {Object} res - The Express response object for error handling.
 * @param {Function} next - Express next middleware function reference.
 */
const authMiddleware = (req, res, next) => {
  // Extract token directly from the HttpOnly cookie set at login/refresh
  const token = req.cookies?.accessToken;
  
  if (!token) {
    return sendError(res, "Authentication required", 401);
  }

  try {
    // Verify the token cryptographic signature and attach the payload natively
    req.user = verifyAccessToken(token); // Yields: { userId, firstName, lastName }
    
    // Explicitly command Express to proceed to the destination route handler
    next();
  } catch (error) {
    // Escalate specific error if token is expired, maliciously altered, or signed incorrectly
    sendError(res, "Invalid or expired access token", 403);
  }
};

export default authMiddleware;
