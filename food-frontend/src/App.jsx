import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

// Eagerly loaded — these are on the critical path (first routes users land on)
import Home from './pages/Home';
import Auth from './pages/Auth';
import Restaurants from './pages/Restaurants';

// Lazily loaded — only fetched when the user navigates to these routes
const Chatbot = lazy(() => import('./pages/Chatbot'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Router>
      <Suspense fallback={null}>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/restaurants" element={<Restaurants />} />

          {/* Protected Routes (Require Login) */}
          <Route path="/chatbot" element={<PrivateRoute><Chatbot /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
