/**
 * @file authCtrl.js
 * @module controllers/authCtrl
 *
 * @description
 * Handles all authentication lifecycle operations for MunchMate: user registration,
 * credential-based login, silent token refresh, and logout.
 *
 * **Architectural role:**
 * Sits in the controller layer — validates input, delegates persistence to the
 * repository layer, and delegates token generation to JWT utilities. Controllers
 * contain no raw SQL and no business logic beyond orchestrating those layers.
 *
 * **Token strategy:**
 * The app uses a dual-token scheme:
 * - **Access token** (1 h TTL) — short-lived, sent on every authenticated request.
 * - **Refresh token** (7 d TTL) — long-lived, used only to silently reissue access tokens.
 *
 * Both tokens are stored in `HttpOnly` cookies so they are never accessible to
 * client-side JavaScript, mitigating XSS-based token theft.
 *
 * **Dependencies:**
 * - `bcryptjs`            — password hashing and comparison
 * - `jsonwebtoken`        — refresh token verification
 * - `utils/jwtUtils`      — access/refresh token generation
 * - `utils/responseHandler` — standardised JSON response helpers
 * - `utils/validators/authValidator` — signup input validation
 * - `repositories/userRepository` — all database interactions
 *
 * @example <caption>Quick Start — registered routes that map to this controller</caption>
 * ```js
 * import authCtrl from '../controllers/authCtrl.js';
 *
 * router.post('/auth/signup',  authCtrl.signup);
 * router.post('/auth/login',   authCtrl.login);
 * router.post('/auth/refresh', authCtrl.refresh);
 * router.post('/auth/logout',  authCtrl.logout);
 * ```
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import { validateSignupParams } from '../utils/validators/authValidator.js';
import userRepository from '../repositories/userRepository.js';

/** @type {boolean} Cached once at startup to avoid repeated env lookups per request. */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Builds a secure cookie options object for a given TTL.
 *
 * `sameSite` is set to `'none'` in production because the frontend (Firebase Hosting) and
 * backend (GCP Cloud Run) live on different origins — cross-site cookies require
 * `SameSite=None`. In development both run on localhost so `'strict'` is safe
 * and avoids needing HTTPS locally.
 *
 * @param {number} maxAgeMs - Cookie lifetime in milliseconds.
 * @returns {{ httpOnly: boolean, secure: boolean, sameSite: string, maxAge: number }}
 *   A cookie options object ready to pass to `res.cookie()`.
 */
const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,                                      // Never readable by client-side JS
  secure: isProduction,                                // HTTPS-only in production
  sameSite: isProduction ? 'lax' : 'strict',
  maxAge: maxAgeMs,
});

/**
 * @namespace authCtrl
 * @description Controller object grouping all authentication route handlers.
 */
const authCtrl = {
  /**
   * Registers a new user account and initialises their cuisine preferences.
   *
   * Validates the request payload, hashes the plaintext password, persists the
   * user row, then immediately creates a linked preferences row so downstream
   * queries never have to handle a missing preferences record.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string}   req.body.firstName        - User's first name.
   *   @param {string}   req.body.lastName         - User's last name.
   *   @param {string}   req.body.email            - Unique email address.
   *   @param {string}   req.body.password         - Plaintext password (min 8 chars, 1 uppercase, 1 number).
   *   @param {string[]} [req.body.favoriteCuisines=[]] - Optional list of preferred cuisine types.
   *   @param {string}   [req.body.priceRange='$$']     - Optional Yelp-style price range filter.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends a 201 JSON response on success; 400 on validation
   *   failure; 409 on duplicate email; 500 on unexpected server error.
   */
  signup: async (req, res) => {
    try {
      const { firstName, lastName, email, password, favoriteCuisines, priceRange } = req.body;

      const { isValid, error } = validateSignupParams(req.body);
      if (!isValid) return sendError(res, error, 400);

      // bcrypt salt factor 10 strikes the standard balance between brute-force resistance
      // and acceptable hashing latency (~100 ms on modern hardware).
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await userRepository.createUser(firstName, lastName, email, hashedPassword);

      // Preferences are created immediately after the user row so there is always
      // exactly one preferences record per user — no nullable JOIN needed later.
      await userRepository.createPreferences(
        result.insertId,
        JSON.stringify(favoriteCuisines || []),
        priceRange || '$$'
      );

      sendSuccess(res, { message: "Signup successful! Please log in." }, 201);
    } catch (error) {
      console.error("Signup error:", error);
      if (error.code === 'ER_DUP_ENTRY') {
        return sendError(res, "An account with that email already exists.", 409);
      }
      sendError(res);
    }
  },

  /**
   * Authenticates a user with email and password, issuing JWT tokens on success.
   *
   * Uses a timing-safe bcrypt comparison to validate credentials, then sets both
   * the access token and refresh token as `HttpOnly` cookies. Only non-sensitive
   * profile fields are returned in the response body.
   *
   * **Complexity:** O(2^cost) for the bcrypt comparison (cost factor = 10),
   * which is intentional — it makes offline brute-force attacks computationally
   * expensive. All other operations are O(1).
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   * @param {string} req.body.email    - The user's registered email address.
   * @param {string} req.body.password - The plaintext password to verify.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends a 200 JSON response with public user fields and
   *   sets two `HttpOnly` cookies (`accessToken`, `refreshToken`) on success;
   *   401 if credentials are invalid; 500 on unexpected server error.
   *
   * @throws Will call `sendError(res)` (500) if the database query fails.
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const users = await userRepository.findByEmail(email);

      // Combining the existence check and the bcrypt compare in one condition
      // avoids a separate round-trip and returns the same 401 for both "user not
      // found" and "wrong password" — preventing user enumeration via error messages.
      if (!users.length || !(await bcrypt.compare(password, users[0].password_hash))) {
        return sendError(res, "Invalid email or password.", 401);
      }

      const user = users[0];
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user.id);

      // HttpOnly cookies are invisible to document.cookie and XHR/fetch — tokens
      // cannot be stolen by injected scripts even if an XSS vulnerability exists.
      res.cookie('accessToken', accessToken, cookieOptions(60 * 60 * 1000));            // 1 h
      res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 d

      // Never include password_hash or internal IDs beyond what the UI needs.
      sendSuccess(res, {
        message: "Login successful!",
        user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email }
      });
    } catch (error) {
      console.error("Login error:", error);
      sendError(res);
    }
  },

  /**
   * Silently reissues an access token using a valid refresh token cookie.
   *
   * Called automatically by the frontend when an API request returns 401,
   * allowing the session to be extended without forcing the user to log in again
   * for up to 7 days after their last login.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   * @param {string} req.cookies.refreshToken - The refresh token stored in an HttpOnly cookie.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends a 200 JSON response and sets a fresh `accessToken`
   *   cookie on success; 401 if no refresh token is present; 403 if the token is
   *   invalid or expired; 500 on unexpected server error.
   *
   * @throws Will call `sendError(res, ..., 403)` if `jwt.verify` throws
   *   (`JsonWebTokenError` or `TokenExpiredError`).
   */
  refresh: async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    // Reject immediately rather than attempting verification — avoids unnecessary
    // crypto work when the cookie is simply absent (e.g. logged-out client).
    if (!refreshToken) return sendError(res, "Refresh token required.", 401);

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

      // Re-fetch the user to ensure the account still exists and hasn't been deleted
      // since the refresh token was issued.
      const users = await userRepository.findById(decoded.userId);
      if (!users.length) return sendError(res, "User not found.", 401);

      const user = users[0];
      const accessToken = generateAccessToken(user);

      res.cookie('accessToken', accessToken, cookieOptions(60 * 60 * 1000)); // 1 h
      sendSuccess(res, { message: "Token refreshed." });
    } catch (error) {
      console.error("Refresh error:", error);
      sendError(res, "Invalid or expired refresh token.", 403);
    }
  },

  /**
   * Logs the user out by clearing both JWT cookies on the client.
   *
   * Because tokens are stateless JWTs, the server cannot invalidate them directly.
   * Clearing the cookies is the effective logout mechanism — the browser will no
   * longer send the tokens, so all subsequent authenticated requests will fail.
   *
   * @param {import('express').Request}  _req - Express request object (unused).
   * @param {import('express').Response} res  - Express response object.
   * @returns {void} Sends a 200 JSON response after clearing both cookies.
   */
  logout: (_req, res) => {
    // Cookie attributes must match those used when setting the cookies, otherwise
    // the browser will treat them as different cookies and not clear them.
    const clearOpts = { httpOnly: true, sameSite: isProduction ? 'lax' : 'strict', secure: isProduction };
    res.clearCookie('accessToken', clearOpts);
    res.clearCookie('refreshToken', clearOpts);
    sendSuccess(res, { message: "Logged out." });
  },
};

export default authCtrl;
