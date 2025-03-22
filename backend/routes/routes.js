import authCtrl from "../controllers/authCtrl.js";
import authMiddleware from "../controllers/authMiddleware.js";
import getRestaurantCtrl from "../controllers/getRestaurantCtrl.js";
import getRestaurantDetailsCtrl from "../controllers/getRestaurantDetailsCtrl.js";
import trackClickCtrl from "../controllers/trackClickCtrl.js";
import saveRestaurantsCtrl from "../controllers/saveRestaurantsCtrl.js";


const routes = (app) => {
  app.route("/signup")
  .post(authCtrl.signup);

  app.route("/login")
  .post(authCtrl.login);

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
};

export default routes;