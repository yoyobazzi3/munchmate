import rateLimit from "express-rate-limit";

// Reverse geocode: 30 req/min per IP — Nominatim has strict rate limits
const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many geocode requests, please slow down." },
});

export default geocodeLimiter;
