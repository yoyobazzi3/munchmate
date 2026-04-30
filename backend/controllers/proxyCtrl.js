/**
 * @file proxyCtrl.js
 * @module controllers/proxyCtrl
 *
 * @description
 * Server-side proxy handlers for external resources that cannot be fetched
 * directly from the browser due to CORS restrictions or API key exposure risk.
 *
 * **Architectural role:**
 * Sits in the controller layer — validates inputs, forwards requests to upstream
 * services, and streams or relays the responses back to the client. The backend
 * acts as a trusted intermediary so that the `PLACES_API_KEY` is never sent to
 * the browser and Nominatim's browser-blocking CORS policy is bypassed cleanly.
 *
 * **Endpoints served:**
 * | Handler          | Method | Route                   | Purpose                                  |
 * |------------------|--------|-------------------------|------------------------------------------|
 * | `imageProxy`     | GET    | /proxy/image            | Stream a Google Places photo to the client |
 * | `reverseGeocode` | GET    | /proxy/reverse-geocode  | Convert coordinates to a city name        |
 *
 * **Security notes:**
 * - `imageProxy` validates `ref` against a strict regex before forwarding to
 *   prevent path traversal attacks (e.g. `../../secrets`).
 * - `imageProxy` caps `w` at 1600 px to prevent unbounded upstream requests.
 * - `PLACES_API_KEY` is appended server-side and never leaves the backend.
 * - `reverseGeocode` URL-encodes `lat`/`lon` before interpolation to prevent
 *   injection into the Nominatim query string.
 *
 * **Dependencies:**
 * - `node-fetch` — HTTP client for server-side upstream requests
 *
 * @example <caption>Quick Start — registered routes that map to this controller</caption>
 * ```js
 * import proxyCtrl from '../controllers/proxyCtrl.js';
 *
 * router.get('/proxy/image',           proxyCtrl.imageProxy);
 * router.get('/proxy/reverse-geocode', proxyCtrl.reverseGeocode);
 * ```
 */

import fetch from 'node-fetch';

/**
 * @namespace proxyCtrl
 * @description Controller object grouping all proxy route handlers.
 */
const proxyCtrl = {
  /**
   * Streams a Google Places photo to the client via the backend, keeping the
   * API key server-side and satisfying browser CORS requirements.
   *
   * The `ref` parameter must match `places/<placeId>/photos/<photoId>` exactly.
   * This regex rejects any value containing `..` or extra path segments, closing
   * the path traversal vector that would otherwise allow an attacker to craft an
   * arbitrary upstream URL using the backend's API key.
   *
   * The response is piped directly from the upstream to the client without
   * buffering the full image in memory — important for large images on a
   * serverless instance with limited RAM.
   *
   * `Cross-Origin-Resource-Policy: cross-origin` is required because the Vercel
   * frontend and the GCP backend are on different origins. Without it, Helmet's
   * default `same-origin` CORP header causes the browser to block the image.
   *
   * **Complexity:** O(1) — constant validation + a streaming pipe; memory usage
   * is proportional to the pipe buffer, not the full image size.
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string} req.query.ref - Google Places photo reference
   *     (format: `places/<placeId>/photos/<photoId>`). Required.
   *   @param {string} [req.query.w] - Desired image width in pixels; clamped to [1, 1600].
   * @param {import('express').Response} res - Express response object (image bytes streamed).
   * @returns {Promise<void>} Pipes the upstream image bytes directly to the response on success;
   *   400 if `ref` is missing or fails the path-traversal check;
   *   502 on upstream network failure; upstream status code on a non-OK upstream response.
   */
  imageProxy: async (req, res) => {
    const { ref, w } = req.query;

    // Strict allowlist regex — only the exact Places photo path shape is accepted.
    // Rejects '..' and extra segments to close the path traversal vector.
    if (!ref || !/^places\/[^/]+\/photos\/[^/]+$/.test(ref)) {
      return res.status(400).json({ error: 'Invalid image reference parsing parameters.' });
    }

    // Cap width at 1600 px to prevent unbounded upstream requests.
    const width = Math.min(parseInt(w) || 400, 1600);

    try {
      const apiKey = process.env.PLACES_API_KEY;
      const upstream = await fetch(
        `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${width}&key=${apiKey}`
      );

      if (!upstream.ok) return res.status(upstream.status).end();

      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      // 24-hour browser cache — photo references are stable; stale images are not a concern.
      res.setHeader('Cache-Control', 'public, max-age=86400');
      // Required for cross-origin image loading from the Vercel frontend —
      // Helmet's default same-origin CORP header blocks it without this override.
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      // Pipe instead of buffer — avoids holding the full image in memory on the server.
      upstream.body.pipe(res);
    } catch {
      res.status(502).end();
    }
  },

  /**
   * Converts geographic coordinates to a human-readable city/address string
   * using the OpenStreetMap Nominatim API.
   *
   * Nominatim blocks direct browser requests with a CORS policy, so this handler
   * acts as a relay — the browser calls the backend, the backend calls Nominatim,
   * and the result is forwarded back. The `User-Agent` header is required by
   * Nominatim's usage policy; requests without it may be throttled or rejected.
   *
   * `lat` and `lon` are URL-encoded before interpolation to prevent injection
   * into the Nominatim query string (e.g. a value of `0&email=attacker@x.com`
   * would otherwise append extra query parameters to the upstream URL).
   *
   * **Complexity:** O(1) — single upstream HTTP call; no local computation.
   * Total latency is dominated by the Nominatim network round-trip (~100–400 ms).
   *
   * @async
   * @param {import('express').Request}  req - Express request object.
   *   @param {string} req.query.lat - Decimal latitude. Required.
   *   @param {string} req.query.lon - Decimal longitude. Required.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>} Sends 200 with the raw Nominatim JSON payload on success;
   *   400 if `lat` or `lon` is missing; 500 on upstream network failure.
   */
  reverseGeocode: async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        // User-Agent is required by Nominatim's usage policy — requests without it may be rejected.
        { headers: { 'User-Agent': 'MunchMate/1.0' } }
      );

      const data = await response.json();
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Reverse geocoding failed.' });
    }
  },
};

export default proxyCtrl;
