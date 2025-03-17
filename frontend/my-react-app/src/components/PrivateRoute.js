import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getToken } from "../utils/tokenService"; // ✅ Correct Import

const PrivateRoute = ({ children }) => {
  const token = getToken(); // ✅ Use getToken() helper

  if (!token) {
    console.warn("No token found. Redirecting to login.");
    return <Navigate to="/auth" />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Get current time in seconds

    if (decoded.exp < currentTime) {
      console.warn("Token expired. Redirecting to login.");
      removeToken(); // ✅ Clear token on expiration
      return <Navigate to="/auth" />;
    }

    return children; // ✅ Render the protected page
  } catch (error) {
    console.error("Invalid token:", error);
    removeToken();
    return <Navigate to="/auth" />;
  }
};

export default PrivateRoute;