/**
 * authService.js — Authentication API Layer
 *
 * Centralizes all HTTP calls for authentication: login, signup, logout,
 * and session verification.
 *
 * Token management strategy:
 *  - Login and signup responses set HttpOnly cookies on the backend.
 *    These cookies are attached automatically by the browser and are never
 *    accessible to JavaScript.
 *  - Non-sensitive user info (name, email, id) returned by /login is stored
 *    in localStorage by the caller after a successful login.
 *  - Logout asks the backend to clear those cookies.
 *
 * Every function:
 *  - Returns the parsed response body (`response.data`) on success
 *  - Lets Axios errors propagate so callers can handle them with try/catch
 */

import api from "../utils/axiosInstance";
import { ENDPOINTS } from "../utils/apiEndpoints";

/**
 * Authenticates an existing user with email and password.
 * On success the backend sets HttpOnly access and refresh token cookies.
 *
 * @param {Object} credentials           - Login credentials
 * @param {string} credentials.email     - User's email address
 * @param {string} credentials.password  - User's plain-text password
 * @returns {Promise<Object>} Response payload containing `user` object
 * @returns {Object} .user - Non-sensitive user info to store in localStorage
 */
export const login = (credentials) =>
  api.post(ENDPOINTS.AUTH.LOGIN, credentials).then((res) => res.data);

/**
 * Registers a new user account.
 * On success the account is created; the user must then log in separately.
 *
 * @param {Object} userData               - Registration data
 * @param {string} userData.firstName     - User's first name
 * @param {string} userData.lastName      - User's last name
 * @param {string} userData.email         - User's email address
 * @param {string} userData.password      - User's chosen password
 * @returns {Promise<Object>} Confirmation payload from the backend
 */
export const signup = (userData) =>
  api.post(ENDPOINTS.AUTH.SIGNUP, userData).then((res) => res.data);

/**
 * Ends the current session by asking the backend to clear the HttpOnly
 * token cookies. The caller is responsible for clearing local user state
 * (localStorage) and redirecting after this resolves.
 *
 * @returns {Promise<Object>} Confirmation payload from the backend
 */
export const logout = () =>
  api.post(ENDPOINTS.AUTH.LOGOUT).then((res) => res.data);

/**
 * Verifies whether the current session is still valid.
 * Used by PrivateRoute to gate access to authenticated pages. The browser
 * automatically sends the accessToken cookie with this request.
 *
 * @returns {Promise<Object>} Verification payload from the backend
 */
export const verify = () =>
  api.get(ENDPOINTS.AUTH.VERIFY).then((res) => res.data);

/**
 * Requests a password-reset code to be sent to the given email address.
 *
 * @param {string} email - The email address associated with the account
 * @returns {Promise<Object>} Response payload
 * @returns {string}  .message  - Confirmation message to display to the user
 * @returns {string}  [.devCode] - Reset code exposed in dev/staging environments
 */
export const forgotPassword = (email) =>
  api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }).then((res) => res.data);

/**
 * Resets a user's password using the code received via email.
 *
 * @param {Object} payload              - Reset payload
 * @param {string} payload.email        - The account email address
 * @param {string} payload.code         - The 6-digit reset code from the email
 * @param {string} payload.newPassword  - The new password to set
 * @returns {Promise<Object>} Confirmation payload from the backend
 */
export const resetPassword = (payload) =>
  api.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload).then((res) => res.data);
