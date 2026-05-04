/**
 * @file corsOptions.js
 * @description CORS configuration for the Express app.
 *
 * Allowed origins are driven by the FRONTEND_URL environment variable so the
 * same config works in every environment without code changes:
 *   - Local dev:   FRONTEND_URL=http://localhost:5173
 *   - Production:  FRONTEND_URL=https://munchmate-iota.vercel.app
 *   - Multiple:    FRONTEND_URL=https://a.example.com,https://b.example.com
 *
 * Falls back to localhost:5173 when FRONTEND_URL is not set.
 */

/**
 * List of origins permitted to make cross-origin requests.
 * Parsed from the comma-separated FRONTEND_URL env var at startup.
 *
 * @type {string[]}
 */
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

/**
 * Options passed to the `cors` middleware.
 *
 * - `origin`: Runs on every incoming request. Requests with no Origin header
 *   (e.g. same-origin, server-to-server, curl) are allowed through unconditionally.
 *   Browser cross-origin requests must match an entry in `allowedOrigins`.
 *
 * - `credentials`: Must be `true` to allow the browser to send cookies
 *   (JWT refresh token httpOnly cookie) with cross-origin requests.
 *
 * @type {import('cors').CorsOptions}
 */
const isLocalhost = (origin) => /^https?:\/\/localhost(:\d+)?$/.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow any localhost port in development so Vite port changes don't break auth
    if (process.env.NODE_ENV !== 'production' && isLocalhost(origin)) {
      return callback(null, true);
    }
    const allowed = allowedOrigins.some(o => origin === o);
    if (allowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

export default corsOptions;
