import signupCtrl from "../controllers/signupCtrl.js";
import loginCtrl from "../controllers/loginCtrl.js";
import getRestaurantCtrl from "../controllers/getRestaurantCtrl.js";

const routes = (app) => {
  // User Authentication Routes
  app.route("/signup").post(signupCtrl.signup);
  app.route("/login").post(loginCtrl.login);

  

  // Get Restaurants (Public Route)
  app.route("/getRestaurants").get(getRestaurantCtrl.getAllRestaurants);

  // Protected Route Example (Only Accessible with JWT Token)
  
};

export default routes;