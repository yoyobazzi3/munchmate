/**
 * authMiddleware.js — JWT Authentication Guard
 *
 * Protects routes that require a fully authenticated user.
 * Extracts the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded user payload to `req.user` for downstream controllers.
 *
 * If the token is missing or invalid, the request is rejected immediately
 * with a 401 or 403 before any controller logic runs.
 *
 * Usage in routes:
 *   app.get("/protected-route", authMiddleware, myController.handler);
 *
 * req.user shape after passing:
 *   { userId, firstName, lastName }
 */

import { verifyAccessToken } from '../utils/jwtUtils.js';
import { sendError } from '../utils/responseHandler.js';

const authMiddleware = (req, res, next) => {
  // Extract token from the HttpOnly cookie set at login
  const token = req.cookies?.accessToken;
  if (!token) return sendError(res, "Unauthorized", 401);

  try {
    // Verify the token and attach the decoded payload to the request
    req.user = verifyAccessToken(token); // { userId, firstName, lastName }
    next();
  } catch (error) {
    // Token is expired, malformed, or signed with the wrong secret
    sendError(res, "Invalid token", 403);
  }
};

export default authMiddleware;
