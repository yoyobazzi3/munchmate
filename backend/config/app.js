/**
 * @file app.js
 * @description Express application factory — wires up all middleware and routes.
 * Imported by index.js which binds the app to a port.
 */

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from '../routes/routes.js';
import corsOptions from './corsOptions.js';

const app = express();

// Trust GCP's reverse proxy so the rate limiter reads the real client IP
// rather than the proxy's IP, which would cause all clients to share one bucket.
app.set('trust proxy', 1);

// Set secure HTTP response headers (XSS protection, clickjacking prevention, etc.)
app.use(helmet());

// Gzip-compress response bodies to reduce payload size over the wire
app.use(compression());

// Restrict cross-origin requests to the allowed origins defined in corsOptions
app.use(cors(corsOptions));

// Parse the Cookie header and expose cookies on req.cookies
app.use(cookieParser());

// Log HTTP requests to stdout in concise dev format (method, URL, status, response time)
app.use(morgan('dev'));

// Parse application/json request bodies and expose them on req.body
app.use(express.json());

// Parse application/x-www-form-urlencoded request bodies and expose them on req.body
app.use(express.urlencoded({ extended: true }));

// Mount all API routes at the root level (for local dev)
routes(app);

// Also mount all routes under /api for Firebase Hosting compatibility
// (Firebase rewrites preserve the /api prefix when proxying to Cloud Run)
const apiRouter = express.Router();
routes(apiRouter);
app.use('/api', apiRouter);

/**
 * Catch-all 404 handler — reached only when no registered route matched.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
