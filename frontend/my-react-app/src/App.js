import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import Recommendations from "./pages/Recommendations";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route (Login/Signup) */}
        <Route path="/" element={<Auth />} />

        {/* Protected Routes (Require Login) */}
        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;