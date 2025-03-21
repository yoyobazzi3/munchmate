import authCtrl from "../controllers/authCtrl.js";
import authMiddleware from "../controllers/authMiddleware.js";
import getRestaurantCtrl from "../controllers/getRestaurantCtrl.js";
import getRestaurantDetailsCtrl from "../controllers/getRestaurantDetailsCtrl.js";

const routes = (app) => {
  app.route("/signup").post(authCtrl.signup);
  app.route("/login").post(authCtrl.login);
  app.route("/getRestaurants").get(authMiddleware, getRestaurantCtrl.getAllRestaurants);
  app.route("/getRestaurantDetails/:id").get(getRestaurantDetailsCtrl.getRestaurantDetails);
};

export default routes;