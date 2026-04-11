import rateLimit from "express-rate-limit";

// Image proxy: generous limit since images load on page render
const imageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many image requests." },
});

export default imageLimiter;
