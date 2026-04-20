import authCtrl from "../controllers/authCtrl.js";
import forgotPasswordCtrl from "../controllers/forgotPasswordCtrl.js";
import resetPasswordCtrl from "../controllers/resetPasswordCtrl.js";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuthMiddleware from "../middleware/optionalAuthMiddleware.js";
import getRestaurantCtrl from "../controllers/getRestaurantCtrl.js";
import getRestaurantDetailsCtrl from "../controllers/getRestaurantDetailsCtrl.js";
import trackClickCtrl from "../controllers/trackClickCtrl.js";
import chatbotCtrl from "../controllers/chatbotCtrl.js";
import getChatHistoryCtrl from "../controllers/getChatHistoryCtrl.js";
import preferencesCtrl from "../controllers/preferencesCtrl.js";
import favoritesCtrl from "../controllers/favoritesCtrl.js";
import recommendationsCtrl from "../controllers/recommendationsCtrl.js";
import diningInsightsCtrl, { getSpendingInsights } from "../controllers/diningInsightsCtrl.js";
import tasteProfileCtrl from "../controllers/tasteProfileCtrl.js";
import proxyCtrl from "../controllers/proxyCtrl.js";

import authLimiter from "../middleware/limiters/authLimiter.js";
import chatbotLimiter from "../middleware/limiters/chatbotLimiter.js";
import chatbotDailyLimiter from "../middleware/limiters/chatbotDailyLimiter.js";
import geocodeLimiter from "../middleware/limiters/geocodeLimiter.js";
import imageLimiter from "../middleware/limiters/imageLimiter.js";
import placesLimiter from "../middleware/limiters/placesLimiter.js";

/**
 * Executes dynamic routing map binding controllers precisely to respective endpoints.
 * Explicitly guards components via defined strict limits and isolated Middleware behaviors.
 * 
 * @param {Object} app - Configured express instance root.
 */
const routes = (app) => {
  // Authentication routes
  app.route("/signup")
    .post(authLimiter, authCtrl.signup);

  app.route("/login")
    .post(authLimiter, authCtrl.login);

  app.route("/auth/refresh")
    .post(authLimiter, authCtrl.refresh);

  app.route("/logout")
    .post(authCtrl.logout);

  app.route("/auth/forgot-password")
    .post(authLimiter, forgotPasswordCtrl);

  app.route("/auth/reset-password")
    .post(authLimiter, resetPasswordCtrl);

  // Lightweight auth check — PrivateRoute calls this to verify the access token cookie is valid
  app.get("/auth/verify", authMiddleware, (_req, res) => res.json({ ok: true }));

  // Restaurant routes
  app.route("/getRestaurants")
    .get(placesLimiter, optionalAuthMiddleware, getRestaurantCtrl.getAllRestaurants);

  app.route("/getRestaurantDetails/:id")
    .get(placesLimiter, authMiddleware, getRestaurantDetailsCtrl.getRestaurantDetails);

  app.route("/trackClick")
    .post(authMiddleware, trackClickCtrl.trackClick);

  app.route("/clickHistory/:userId")
    .get(authMiddleware, trackClickCtrl.getClickHistory);

  // Security & Remote Proxies
  app.get("/image-proxy", imageLimiter, proxyCtrl.imageProxy);
  app.get("/reverse-geocode", geocodeLimiter, authMiddleware, proxyCtrl.reverseGeocode);

  // Recommendations Route
  app.get("/recommendations", authMiddleware, recommendationsCtrl);

  // Dining Insights Route
  app.get("/dining-insights", authMiddleware, diningInsightsCtrl);
  app.get("/dining-insights/spending", authMiddleware, getSpendingInsights);

  // Taste Profile Route
  app.get("/taste-profile", authMiddleware, tasteProfileCtrl);

  // Favorites Routes
  app.get("/favorites/visited-summary", authMiddleware, favoritesCtrl.getVisitedWithSpend);

  app.route("/favorites")
    .get(authMiddleware, favoritesCtrl.getFavorites)
    .post(authMiddleware, favoritesCtrl.addFavorite);

  app.route("/favorites/:restaurantId")
    .patch(authMiddleware, favoritesCtrl.updateFavorite)
    .delete(authMiddleware, favoritesCtrl.removeFavorite);

  app.patch("/favorites/:restaurantId/spend", authMiddleware, favoritesCtrl.updateSpend);
  app.get("/favorites/:restaurantId/spend", authMiddleware, favoritesCtrl.getSpendLogs);

  // User Settings Routes
  app.route("/preferences")
    .get(authMiddleware, preferencesCtrl.getPreferences)
    .put(authMiddleware, preferencesCtrl.updatePreferences);

  // Groq / Chatbot Routes
  app.route("/chatbot/ask")
    .post(authMiddleware, chatbotLimiter, chatbotDailyLimiter, chatbotCtrl.chat);

  app.route("/chatbot/history")
    .get(authMiddleware, getChatHistoryCtrl.getChatHistory);

  app.route("/chatbot/clear")
    .delete(authMiddleware, getChatHistoryCtrl.clearHistory);
};

export default routes;

