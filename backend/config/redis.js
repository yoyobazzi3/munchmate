/**
 * @file redis.js
 * @module config/redis
 *
 * @description
 * Initializes and exports a singleton Upstash Redis client for use across the
 * MunchMate backend.
 *
 * **Architectural role:**
 * This module sits in the config layer and is imported by any service that needs
 * fast ephemeral storage — primarily the rate-limiter middleware and any future
 * caching layers (e.g. Yelp/Places API response caching).
 *
 * **Why Upstash?**
 * Upstash exposes Redis over HTTP/REST rather than a persistent TCP connection.
 * This is intentional: serverless and edge runtimes (GCP Cloud Run, Vercel Edge)
 * do not support long-lived TCP sockets, so a REST-based client is the only
 * viable option without managing connection pools manually.
 *
 * **Dependencies:**
 * - `@upstash/redis` — official Upstash REST client
 * - `UPSTASH_REDIS_REST_URL`  — Upstash database REST endpoint (from .env)
 * - `UPSTASH_REDIS_REST_TOKEN` — Upstash read/write token (from .env)
 *
 * @example <caption>Quick Start — importing the client in another module</caption>
 * ```js
 * import redis from '../config/redis.js';
 *
 * // Store a value with a 60-second TTL
 * await redis.set('key', 'value', { ex: 60 });
 *
 * // Retrieve it
 * const value = await redis.get('key'); // → 'value'
 *
 * // Atomically increment a counter (used by the rate limiter)
 * const count = await redis.incr('rate:127.0.0.1');
 * ```
 */

import { Redis } from '@upstash/redis';

/**
 * Singleton Upstash Redis client.
 *
 * Instantiated once at module load time so every importer shares the same
 * instance — avoids creating redundant HTTP clients and keeps credential
 * resolution predictable (env vars are read once on startup).
 *
 * @type {import('@upstash/redis').Redis}
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default redis;
