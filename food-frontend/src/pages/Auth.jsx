import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login, signup } from "../services/authService";
import { getErrorMessage } from "../utils/errorHandler";
import { useUser } from "../context/UserContext";
import { ROUTES, AUTH_ROUTES } from "../utils/routes";
import "./Auth.css";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useUser();

  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get("mode");

  const [isLogin, setIsLogin] = useState(mode === "login");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    setIsLogin(mode === "login");
  }, [mode]);

  const toggleForm = () => {
    setIsLogin(!isLogin);
    navigate(!isLogin ? AUTH_ROUTES.LOGIN : AUTH_ROUTES.SIGNUP);
    setPasswordError("");
    setServerError("");
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setServerError("");
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const validatePasswords = () => {
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    const { confirmPassword: _confirmPassword, ...dataToSend } = formData;

    try {
      if (isLogin) {
        // Tokens are set as HttpOnly cookies by the backend — only store non-sensitive user info
        const data = await login(dataToSend);
        loginUser(data.user);
        navigate(ROUTES.HOME);
      } else {
        await signup(dataToSend);
        setIsLogin(true);
        navigate(AUTH_ROUTES.LOGIN);
      }
    } catch (err) {
      setServerError(getErrorMessage(err, "Something went wrong. Please try again."));
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <Link to="/" className="auth-left-logo">
          <img src="/logo.png" alt="MunchMate Logo" />
          <span>MunchMate</span>
        </Link>
        <div className="auth-left-content">
          <h2>Discover Delicious<br />Food Near You</h2>
          <p>Find the perfect restaurant based on your location, preferences, and cravings. Let our AI guide you to your next favorite meal.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <button 
          className="auth-return-home" 
          onClick={() => navigate(ROUTES.HOME)}
          type="button"
        >
          &larr; Return Home
        </button>
        <div className="auth-right-header">
          <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p>{isLogin ? "Sign in to continue to MunchMate" : "Join MunchMate and find your next favorite meal"}</p>
        </div>

        <form className="auth-form" onSubmit={handleFormSubmit}>
          {!isLogin && (
            <div className="auth-name-row">
              <div className="auth-input-group">
                <label>First name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="auth-input-group">
                <label>Last name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="hello@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="auth-input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              {passwordError && <p className="auth-error">{passwordError}</p>}
            </div>
          )}

          {!isLogin && (
            <div className="auth-checkbox-group">
              <input type="checkbox" name="agree" required />
              <label>I agree to the Terms of Service and Privacy Policy</label>
            </div>
          )}

          {serverError && <p className="auth-error">{serverError}</p>}

          <button type="submit" className="auth-submit-btn">
            {isLogin ? "Sign In" : "Create account"}
          </button>
        </form>

        <p className="auth-toggle-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button className="auth-toggle-btn" onClick={toggleForm}>
            {isLogin ? " Sign Up" : " Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;