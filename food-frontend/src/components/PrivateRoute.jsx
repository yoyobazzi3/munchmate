import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../utils/axiosInstance.js";
import { clearUser } from "../utils/tokenService.js";
import { ROUTES } from "../utils/routes.js";
import { ENDPOINTS } from "../utils/apiEndpoints.js";

/**
 * PrivateRoute — Guards routes that require authentication.
 *
 * Since tokens are now stored in HttpOnly cookies (not readable by JS),
 * we verify auth by calling GET /auth/verify on the backend. The browser
 * automatically sends the accessToken cookie with the request.
 *
 * States:
 *  - "checking" → show nothing while the verify request is in flight
 *  - "ok"       → render the protected page
 *  - "fail"     → redirect to login
 */
const PrivateRoute = ({ children }) => {
  const [authState, setAuthState] = useState("checking");

  useEffect(() => {
    api.get(ENDPOINTS.AUTH.VERIFY)
      .then(() => setAuthState("ok"))
      .catch(() => {
        clearUser();
        setAuthState("fail");
      });
  }, []);

  if (authState === "checking") return null;
  if (authState === "fail") return <Navigate to={ROUTES.AUTH} replace />;
  return children;
};

export default PrivateRoute;
