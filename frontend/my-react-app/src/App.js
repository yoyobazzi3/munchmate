import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Restaurants from './pages/Restaurants';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import Chatbot from './pages/Chatbot';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />

        {/* Protected Routes (Require Login) */}
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/restaurants" element={<PrivateRoute><Restaurants /></PrivateRoute>} />
        <Route path="/chatbot" element={<PrivateRoute><Chatbot /></PrivateRoute>} />
        {/* <Route path="/recommendations" element={<PrivateRoute><Chatbot /></PrivateRoute>} /> */}
      </Routes>
    </Router>
  );
}

export default App;