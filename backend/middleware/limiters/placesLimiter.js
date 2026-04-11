import rateLimit from "express-rate-limit";

// Places API endpoints: protect quota (each request can cost multiple API calls)
// 100 per 15 min is a safe balance between usability and API cost protection
const placesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

export default placesLimiter;
