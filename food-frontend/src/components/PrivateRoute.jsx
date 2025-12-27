import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getToken, removeToken } from "../utils/tokenService.js";

const PrivateRoute = ({ children }) => {
  const token = getToken();

  // If no token → user is not logged in
  if (!token) {
    console.warn("No token found. Redirecting to login.");
    return <Navigate to="/auth" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;

    // If expired → redirect and remove token
    if (decoded.exp < now) {
      console.warn("Token expired. Redirecting to login.");
      removeToken();
      return <Navigate to="/auth" replace />;
    }

    // Token valid → allow access
    return children;
  } catch (err) {
    console.error("Invalid token:", err);
    removeToken();
    return <Navigate to="/auth" replace />;
  }
};

export default PrivateRoute;
