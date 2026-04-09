import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Restaurants from './pages/Restaurants';
import PrivateRoute from './components/PrivateRoute';
import Chatbot from './pages/Chatbot';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/restaurants" element={<Restaurants />} />

        {/* Protected Routes (Require Login) */}
        <Route path="/chatbot" element={<PrivateRoute><Chatbot /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        {/* <Route path="/recommendations" element={<PrivateRoute><Chatbot /></PrivateRoute>} /> */}
      </Routes>
    </Router>
  );
}

export default App;