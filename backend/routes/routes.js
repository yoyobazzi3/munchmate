import loginCtrl from '../controllers/loginCtrl.js';
import signupCtrl from '../controllers/signupCtrl.js';

const routes = (app) => {
  app.route('/signup').post(signupCtrl.signup);
  app.route('/login').post(loginCtrl.login);

};

export default routes;