/**
 * @file jwtUtils.js
 * @module utils/jwtUtils
 *
 * @description
 * Stateless JWT lifecycle utilities for MunchMate's dual-token authentication scheme.
 *
 * **Architectural role:**
 * Sits in the utilities layer — pure functions with no side effects, no database
 * access, and no Express dependencies. Any module that needs to mint or verify a
 * token imports from here, keeping token logic centralised and independently testable.
 *
 * **Token scheme overview:**
 * | Token        | TTL | Payload          | Secret                  | Purpose                        |
 * |--------------|-----|------------------|-------------------------|--------------------------------|
 * | Access token | 1 h | userId, name     | `JWT_SECRET`            | Authorise individual requests  |
 * | Refresh token| 7 d | userId only      | `REFRESH_TOKEN_SECRET`  | Silently reissue access tokens |
 *
 * Keeping the two tokens signed with **different secrets** means a compromised
 * access-token secret does not expose the refresh-token surface, and vice versa.
 *
 * **Dependencies:**
 * - `jsonwebtoken` — HMAC-SHA256 signing and verification
 * - `JWT_SECRET`            — env var; signs/verifies access tokens
 * - `REFRESH_TOKEN_SECRET`  — env var; signs/verifies refresh tokens
 *
 * @example <caption>Quick Start</caption>
 * ```js
 * import {
 *   generateAccessToken,
 *   generateRefreshToken,
 *   verifyAccessToken,
 * } from '../utils/jwtUtils.js';
 *
 * // Mint tokens after a successful login
 * const accessToken  = generateAccessToken(userRow);   // expires in 1 h
 * const refreshToken = generateRefreshToken(userRow.id); // expires in 7 d
 *
 * // Verify an incoming access token (e.g. in auth middleware)
 * try {
 *   const payload = verifyAccessToken(accessToken);
 *   console.log(payload.userId);    // → 42
 *   console.log(payload.firstName); // → "Youssef"
 * } catch (err) {
 *   // TokenExpiredError | JsonWebTokenError
 * }
 * ```
 */

import jwt from 'jsonwebtoken';

/**
 * Mints a short-lived access token embedding the minimum user fields needed by
 * the frontend and auth middleware.
 *
 * The payload normalises both database column names (`first_name`, `last_name`)
 * and camelCase aliases (`firstName`, `lastName`) so the function accepts a raw
 * DB row **or** a previously decoded token payload interchangeably — avoiding
 * a separate mapping step at each call site.
 *
 * **Complexity:** O(n) in the length of the payload string — dominated by the
 * HMAC-SHA256 operation inside `jwt.sign`, which is effectively O(1) for
 * fixed-size payloads like this one.
 *
 * @param {Object}          user            - Source object containing user identity fields.
 * @param {number|string}   user.id         - Primary key from the `users` table (DB row form).
 * @param {number|string}  [user.userId]    - Alias accepted when passing a decoded token payload.
 * @param {string}         [user.first_name] - First name in DB column format.
 * @param {string}         [user.firstName]  - First name in camelCase format (either accepted).
 * @param {string}         [user.last_name]  - Last name in DB column format.
 * @param {string}         [user.lastName]   - Last name in camelCase format (either accepted).
 *
 * @returns {string} A signed JWT string valid for 1 hour.
 *
 * @throws {Error} If `JWT_SECRET` is undefined — `jwt.sign` will throw
 *   `"secretOrPrivateKey must have a value"`.
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id || user.userId,
      firstName: user.first_name || user.firstName,
      lastName: user.last_name || user.lastName,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Mints a long-lived refresh token containing only the user's ID.
 *
 * Deliberately omits name and other profile fields — if this token is ever
 * decoded by the refresh endpoint it only needs the ID to look up a fresh user
 * row. Keeping the payload minimal also reduces the token's size and limits the
 * blast radius if the token is somehow intercepted.
 *
 * A separate secret (`REFRESH_TOKEN_SECRET`) is used so that rotating or
 * revoking access-token signing does not simultaneously invalidate all active
 * sessions.
 *
 * **Complexity:** O(1) — fixed-size single-field payload.
 *
 * @param {number|string} userId - The user's primary key from the `users` table.
 *   Must be a stable, non-reassignable identifier.
 *
 * @returns {string} A signed JWT string valid for 7 days.
 *
 * @throws {Error} If `REFRESH_TOKEN_SECRET` is undefined — `jwt.sign` will throw
 *   `"secretOrPrivateKey must have a value"`.
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verifies an access token's signature and expiry, returning its decoded payload.
 *
 * This is a thin wrapper around `jwt.verify` that binds the correct secret so
 * call sites (middleware, controllers) do not need to import or reference
 * `JWT_SECRET` directly — keeping secret usage contained to this module.
 *
 * **Complexity:** O(n) in token length — HMAC-SHA256 verification is O(1) for
 * fixed-size payloads; effectively constant in practice.
 *
 * @param {string} token - The raw JWT string extracted from the `accessToken` cookie.
 *   Must be a non-empty string; passing `null` or `undefined` will throw.
 *
 * @returns {{ userId: number, firstName: string, lastName: string, iat: number, exp: number }}
 *   The decoded token payload if the signature is valid and the token has not expired.
 *
 * @throws {jwt.TokenExpiredError}   If the token's `exp` claim is in the past.
 * @throws {jwt.JsonWebTokenError}   If the signature is invalid, the token is malformed,
 *   or the algorithm does not match.
 * @throws {jwt.NotBeforeError}      If the token's `nbf` claim is in the future (rare).
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
