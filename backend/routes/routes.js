import baseCtrl from '../controllers/baseCtrl.js';
import signupCtrl from '../controllers/signupCtrl.js';
import loginCtrl from '../controllers/loginCtrl.js';
import getRestaurantCtrl from '../controllers/getRestaurantCtrl.js';
const routes = (app) => {

    app.route('/basePage')
    .get(baseCtrl.basePage);

    app.route('/signup')
    .post(signupCtrl.signup);

    app.route('/')
    .post(loginCtrl.login);

    app.route('/getRestaurants')
    .get(getRestaurantCtrl.getAllRestaurants);


}
export default routes;