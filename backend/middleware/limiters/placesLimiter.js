import rateLimit from "express-rate-limit";

// Each authenticated user gets their own 100 req/15 min bucket keyed by userId.
// Unauthenticated guests fall back to IP so they don't share a bucket with
// everyone coming through the same Vercel proxy egress IP.
const placesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId ?? req.ip,
  message: { error: "Too many requests, please slow down." },
});

export default placesLimiter;
