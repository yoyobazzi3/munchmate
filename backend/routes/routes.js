import authCtrl from "../controllers/authCtrl.js";
import authMiddleware from "../controllers/authMiddleware.js"; // Check this path
import optionalAuthMiddleware from "../controllers/optionalAuthMiddleware.js";
import getRestaurantCtrl from "../controllers/getRestaurantCtrl.js";
import getRestaurantDetailsCtrl from "../controllers/getRestaurantDetailsCtrl.js";
import trackClickCtrl from "../controllers/trackClickCtrl.js";
import saveRestaurantsCtrl from "../controllers/saveRestaurantsCtrl.js";
import chatbotCtrl from "../controllers/chatbotCtrl.js";
import getChatHistoryCtrl from "../controllers/getChatHistoryCtrl.js";
import preferencesCtrl from "../controllers/preferencesCtrl.js";

const routes = (app) => {
  // Auth routes
  app.route("/signup")
    .post(authCtrl.signup);

  app.route("/login")
    .post(authCtrl.login);

  app.route("/auth/refresh")
    .post(authCtrl.refresh);

  // Restaurant routes
  app.route("/getRestaurants")
  .get(optionalAuthMiddleware, getRestaurantCtrl.getAllRestaurants);


  app.route("/getRestaurantDetails/:id")
    .get(getRestaurantDetailsCtrl.getRestaurantDetails);

  app.route("/trackClick")
    .post(trackClickCtrl.trackClick);

  app.route("/clickHistory/:userId")
    .get(trackClickCtrl.getClickHistory);

  app.route("/saveRestaurants")
    .post(saveRestaurantsCtrl.saveRestaurants);
  
  // Reverse geocode proxy (avoids browser CORS block on Nominatim)
  app.get("/reverse-geocode", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        { headers: { "User-Agent": "MunchMate/1.0" } }
      );
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Geocoding failed" });
    }
  });

  // Preferences routes
  app.route("/preferences")
    .get(authMiddleware, preferencesCtrl.getPreferences)
    .put(authMiddleware, preferencesCtrl.updatePreferences);

  // Chatbot routes
  app.route("/chatbot/ask")
    .post(authMiddleware, chatbotCtrl.chat);
  
  app.route("/chatbot/stream")
    .get(authMiddleware, chatbotCtrl.streamChat);
  
  app.route("/chatbot/history")
    .get(authMiddleware, getChatHistoryCtrl.getChatHistory);
  
  app.route("/chatbot/clear")
    .delete(authMiddleware, getChatHistoryCtrl.clearHistory);
};

export default routes;

//yoyo