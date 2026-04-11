/**
 * optionalAuthMiddleware.js — Soft JWT Authentication
 *
 * For routes that are accessible to both guests and logged-in users,
 * but behave differently depending on auth state (e.g. /getRestaurants
 * works unauthenticated but can return personalized results when authenticated).
 *
 * If a valid token is present, `req.user` is populated just like authMiddleware.
 * If no token is present OR the token is invalid, the request continues
 * as unauthenticated — no error is returned.
 *
 * Usage in routes:
 *   app.get("/public-route", optionalAuthMiddleware, myController.handler);
 *
 * In controller, check auth state with:
 *   if (req.user) { ...authenticated logic... }
 */

import { verifyAccessToken } from '../utils/jwtUtils.js';

const optionalAuthMiddleware = (req, res, next) => {
  // Read the access token from the HttpOnly cookie; falls back gracefully if absent
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      // Attach user payload if token is valid — silently skip if not
      req.user = verifyAccessToken(token);
    } catch {
      // Invalid or expired token — treat as unauthenticated, don't block the request
    }
  }
  next();
};

export default optionalAuthMiddleware;
