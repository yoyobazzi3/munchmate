import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { PreferencesProvider } from './context/PreferencesContext';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly loaded — these are on the critical path (first routes users land on)
import Home from './pages/Home';
import Auth from './pages/Auth';
import Restaurants from './pages/Restaurants';
import RecoveryPage from './pages/RecoveryPage';

// Lazily loaded — only fetched when the user navigates to these routes
const Chatbot = lazy(() => import('./pages/Chatbot'));
const Profile = lazy(() => import('./pages/Profile'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

/**
 * Route-level error boundary — resets automatically when the user navigates
 * to a different path, so one broken page never takes out the whole app.
 */
function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <UserProvider>
      <PreferencesProvider>
      <Router>
        <Suspense fallback={null}>
          <RouteErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path='/' element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/recovery" element={<RecoveryPage />} />
            <Route path="/restaurants" element={<Restaurants />} />

            {/* Protected Routes (Require Login) */}
            <Route path="/chatbot" element={<PrivateRoute><Chatbot /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
            <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          </Routes>
          </RouteErrorBoundary>
        </Suspense>
      </Router>
      </PreferencesProvider>
    </UserProvider>
  );
}

export default App;
