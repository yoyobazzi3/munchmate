/**
 * errorHandler.js — Unified API Error Utilities
 *
 * Centralizes the logic for extracting user-readable messages from Axios errors
 * so every component handles failures the same way. Without this, each component
 * invents its own fallback string and error shape assumptions diverge over time.
 *
 * Usage:
 *   import { getErrorMessage } from "../utils/errorHandler";
 *
 *   try {
 *     await api.post(ENDPOINTS.AUTH.LOGIN, credentials);
 *   } catch (err) {
 *     setError(getErrorMessage(err));
 *   }
 */

// ── Error message extraction ──────────────────────────────────────────────────

/**
 * Extracts a human-readable error message from an Axios error (or any thrown value).
 *
 * Priority order:
 *  1. `error.response.data.error`  — structured backend error string
 *  2. `error.response.data.message` — alternative backend message field
 *  3. `error.message`              — Axios / network-level message
 *  4. `fallback`                   — caller-supplied default (shown when all else fails)
 *
 * @param {unknown} error    - The caught error value (typically an Axios error).
 * @param {string}  fallback - Message to return when no specific message can be found.
 * @returns {string} A user-facing error string.
 */
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (!error) return fallback;
  return (
    error?.response?.data?.error   ||
    error?.response?.data?.message ||
    error?.message                 ||
    fallback
  );
};

// ── HTTP status helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the error was caused by a network failure (no response received).
 * Use this to show a "check your connection" message instead of a generic server error.
 *
 * @param {unknown} error - The caught error value.
 * @returns {boolean}
 */
export const isNetworkError = (error) =>
  Boolean(error?.isAxiosError && !error.response);

/**
 * Returns true if the server responded with a 4xx status code,
 * indicating a client-side mistake (bad input, unauthorized, not found, etc.).
 *
 * @param {unknown} error - The caught error value.
 * @returns {boolean}
 */
export const isClientError = (error) => {
  const status = error?.response?.status;
  return typeof status === "number" && status >= 400 && status < 500;
};

/**
 * Returns true if the server responded with a 5xx status code,
 * indicating a server-side failure unrelated to the request itself.
 *
 * @param {unknown} error - The caught error value.
 * @returns {boolean}
 */
export const isServerError = (error) => {
  const status = error?.response?.status;
  return typeof status === "number" && status >= 500;
};
