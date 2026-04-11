import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from '../routes/routes.js';
import corsOptions from './corsOptions.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Compress response bodies for all requests
app.use(compression());

// Configure Cross-Origin Resource Sharing (CORS) with abstracted options
app.use(cors(corsOptions));

// Parse Cookie header and populate req.cookies
app.use(cookieParser());

// HTTP request logger middleware for node.js in development mode
app.use(morgan('dev'));

// Parse incoming requests with JSON payloads
app.use(express.json());

// Parse incoming requests with urlencoded payloads
app.use(express.urlencoded({ extended: true }));

// Register application routes
routes(app);

// Handle 404 - Not Found
// Catches all requests that did not match any of the registered routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
