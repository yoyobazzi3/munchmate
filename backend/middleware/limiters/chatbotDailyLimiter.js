import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Chatbot: 100 req/day per user — keeps Groq daily quota safe
const chatbotDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user ? `day:${req.user.userId}` : ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Daily chat limit reached, come back tomorrow." },
});

export default chatbotDailyLimiter;
