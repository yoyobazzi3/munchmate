import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import fetch from "node-fetch";
import authCtrl from "../controllers/authCtrl.js";
import authMiddleware from "../controllers/authMiddleware.js";
import optionalAuthMiddleware from "../controllers/optionalAuthMiddleware.js";
import getRestaurantCtrl from "../controllers/getRestaurantCtrl.js";
import getRestaurantDetailsCtrl from "../controllers/getRestaurantDetailsCtrl.js";
import trackClickCtrl from "../controllers/trackClickCtrl.js";
import chatbotCtrl from "../controllers/chatbotCtrl.js";
import getChatHistoryCtrl from "../controllers/getChatHistoryCtrl.js";
import preferencesCtrl from "../controllers/preferencesCtrl.js";

// ── Rate limiters ────────────────────────────────────────────────────────────

// Auth endpoints: prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

// Places API endpoints: protect quota (each request can cost multiple API calls)
const placesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

// Chatbot: 20 req/min per user
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? String(req.user.userId) : ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Chatbot rate limit reached, please wait a moment." },
});

// Chatbot: 100 req/day per user — keeps Groq daily quota safe
const chatbotDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user ? `day:${req.user.userId}` : ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Daily chat limit reached, come back tomorrow." },
});

// Image proxy: generous limit since images load on page render
const imageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many image requests." },
});

// ── Routes ───────────────────────────────────────────────────────────────────

const routes = (app) => {
  // Auth routes
  app.route("/signup")
    .post(authLimiter, authCtrl.signup);

  app.route("/login")
    .post(authLimiter, authCtrl.login);

  app.route("/auth/refresh")
    .post(authLimiter, authCtrl.refresh);

  // Restaurant routes
  app.route("/getRestaurants")
    .get(placesLimiter, optionalAuthMiddleware, getRestaurantCtrl.getAllRestaurants);

  app.route("/getRestaurantDetails/:id")
    .get(placesLimiter, authMiddleware, getRestaurantDetailsCtrl.getRestaurantDetails);

  app.route("/trackClick")
    .post(authMiddleware, trackClickCtrl.trackClick);

  app.route("/clickHistory/:userId")
    .get(authMiddleware, trackClickCtrl.getClickHistory);

// Image proxy — serves Google Places photos without exposing the API key to browsers
  app.get("/image-proxy", imageLimiter, async (req, res) => {
    const { ref, w } = req.query;
    if (!ref || !/^places\/[^/]+\/photos\/[^/]+$/.test(ref)) {
      return res.status(400).json({ error: "Invalid image reference." });
    }
    const width = Math.min(parseInt(w) || 400, 1600);
    try {
      const apiKey = process.env.PLACES_API_KEY;
      const upstream = await fetch(
        `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${width}&key=${apiKey}`
      );
      if (!upstream.ok) return res.status(upstream.status).end();
      const contentType = upstream.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      upstream.body.pipe(res);
    } catch {
      res.status(502).end();
    }
  });

  // Reverse geocode proxy (avoids browser CORS block on Nominatim)
  app.get("/reverse-geocode", authMiddleware, async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        { headers: { "User-Agent": "MunchMate/1.0" } }
      );
      const data = await response.json();
      res.json(data);
    } catch {
      res.status(500).json({ error: "Geocoding failed" });
    }
  });

  // Preferences routes
  app.route("/preferences")
    .get(authMiddleware, preferencesCtrl.getPreferences)
    .put(authMiddleware, preferencesCtrl.updatePreferences);

  // Chatbot routes
  app.route("/chatbot/ask")
    .post(authMiddleware, chatbotLimiter, chatbotDailyLimiter, chatbotCtrl.chat);

  app.route("/chatbot/stream")
    .get(authMiddleware, chatbotLimiter, chatbotDailyLimiter, chatbotCtrl.streamChat);

  app.route("/chatbot/history")
    .get(authMiddleware, getChatHistoryCtrl.getChatHistory);

  app.route("/chatbot/clear")
    .delete(authMiddleware, getChatHistoryCtrl.clearHistory);
};

export default routes;

//yoyo