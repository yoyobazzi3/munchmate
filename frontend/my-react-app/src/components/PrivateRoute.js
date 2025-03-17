import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";const PrivateRoute = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/auth" />;
    }

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Convert to seconds
        if (decoded.exp < currentTime) {
            console.warn("Token expired. Redirecting to login.");
            localStorage.removeItem("token");
            return <Navigate to="/auth" />;
        }
        return <Outlet />;
    } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        return <Navigate to="/auth" />;
    }
};

export default PrivateRoute;