import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Chatbot: 20 req/min per user
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? String(req.user.userId) : ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Chatbot rate limit reached, please wait a moment." },
});

export default chatbotLimiter;
