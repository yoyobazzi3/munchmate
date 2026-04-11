import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../utils/axiosInstance.js";
import { clearUser } from "../utils/tokenService.js";

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
    api.get("/auth/verify")
      .then(() => setAuthState("ok"))
      .catch(() => {
        clearUser();
        setAuthState("fail");
      });
  }, []);

  if (authState === "checking") return null;
  if (authState === "fail") return <Navigate to="/auth" replace />;
  return children;
};

export default PrivateRoute;
