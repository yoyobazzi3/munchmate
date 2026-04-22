import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/routes.js";

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
  const { authState } = useAuth();

  if (authState === "checking") return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="loading-spinner" />
    </div>
  );
  if (authState === "fail") return <Navigate to={ROUTES.AUTH} replace />;
  return children;
};

export default PrivateRoute;
