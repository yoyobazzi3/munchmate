import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
    const isAuthenticated = localStorage.getItem("token"); // Check login state
    return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;