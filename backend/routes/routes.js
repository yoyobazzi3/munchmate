import authCtrl from "../controllers/authCtrl.js";
import authMiddleware from "../controllers/authMiddleware.js"; // Check this path
import getRestaurantCtrl from "../controllers/getRestaurantCtrl.js";
import getRestaurantDetailsCtrl from "../controllers/getRestaurantDetailsCtrl.js";
import trackClickCtrl from "../controllers/trackClickCtrl.js";
import saveRestaurantsCtrl from "../controllers/saveRestaurantsCtrl.js";
import chatbotCtrl from "../controllers/chatbotCtrl.js";
import getChatHistoryCtrl from "../controllers/getChatHistoryCtrl.js";

const routes = (app) => {
  // Auth routes
  app.route("/signup")
    .post(authCtrl.signup);

  app.route("/login")
    .post(authCtrl.login);

  // Restaurant routes
  app.route("/getRestaurants")
  .get(authMiddleware, getRestaurantCtrl.getAllRestaurants);


  app.route("/getRestaurantDetails/:id")
    .get(getRestaurantDetailsCtrl.getRestaurantDetails);

  app.route("/trackClick")
    .post(trackClickCtrl.trackClick);

  app.route("/clickHistory/:userId")
    .get(trackClickCtrl.getClickHistory);

  app.route("/saveRestaurants")
    .post(saveRestaurantsCtrl.saveRestaurants);
  
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