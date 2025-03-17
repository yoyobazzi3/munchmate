import signupCtrl from '../controllers/signupCtrl.js';
import loginCtrl from '../controllers/loginCtrl.js';
import getRestaurantCtrl from '../controllers/getRestaurantCtrl.js';
import googleSignInCtrl from '../controllers/googleSignInCtrl.js'; 

const routes = (app) => {


    app.route('/signup')
    .post(signupCtrl.signup);
  
    app.route('/login')
    .post(loginCtrl.login);


    app.route('/getRestaurants')
    .get(getRestaurantCtrl.getAllRestaurants);

    app.route('/api/google-signin')
    .post(googleSignInCtrl.googleSignIn);

};

export default routes;