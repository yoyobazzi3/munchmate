import signupCtrl from '../controllers/signupCtrl.js';
import loginCtrl from '../controllers/loginCtrl.js';
import getRestaurantCtrl from '../controllers/getRestaurantCtrl.js';

const routes = (app) => {


    app.route('/signup')
    .post(signupCtrl.signup);
  
    app.route('/login')
    .post(loginCtrl.login);


    app.route('/getRestaurants')
    .get(getRestaurantCtrl.getAllRestaurants);


};

export default routes;