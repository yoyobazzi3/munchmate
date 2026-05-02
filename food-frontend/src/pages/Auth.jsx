import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login, signup } from "../services/authService";
import { getErrorMessage } from "../utils/errorHandler";
import { useUser } from "../hooks/useUser";
import { ROUTES, AUTH_ROUTES } from "../utils/routes";
import "./Auth.css";

/**
 * Reusable input field component for the authentication form.
 * 
 * @param {Object} props
 * @param {string} props.label - Display label.
 * @param {string} props.type - Input type (e.g., text, email, password).
 * @param {string} props.name - Attribute name bindings.
 * @param {string} props.value - Controlled value.
 * @param {function} props.onChange - Handler for updates.
 * @param {string} props.placeholder - Input placeholder.
 * @param {string} [props.error] - Optional validation error message.
 * @param {boolean} [props.required=true] - Makes input mandatory.
 */
const AuthInputField = ({ label, type, name, value, onChange, placeholder, error, required = true }) => (
  <div className="auth-input-group">
    <label>{label}</label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
    {error && <p className="auth-error">{error}</p>}
  </div>
);

/**
 * Stateless functional component rendering the static promotional branding 
 * segment on the left side of the authentication view.
 */
const AuthLeftPanel = () => (
  <div className="auth-left">
    <Link to="/" className="auth-left-logo">
      <img src="/logo.png" alt="MunchMate Logo" />
      <span>MunchMate</span>
    </Link>
    <div className="auth-left-content">
      <h2>Discover Delicious<br />Food Near You</h2>
      <p>
        Find the perfect restaurant based on your location, preferences, and cravings.
        Let our AI guide you to your next favorite meal.
      </p>
    </div>
  </div>
);

/**
 * Authentication page handling both login and signup flows seamlessly.
 *
 * @component
 * @returns {JSX.Element} The authentication interface.
 */
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

  /**
   * Toggles the form between login and signup modes while resetting errors.
   */
  const toggleForm = () => {
    setIsLogin(!isLogin);
    navigate(!isLogin ? AUTH_ROUTES.LOGIN : AUTH_ROUTES.SIGNUP);
    setPasswordError("");
    setServerError("");
  };

  /**
   * Universal input change handler for syncing form fields.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setServerError("");
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setPasswordError("");
    }
  };

  /**
   * Validates signup passwords for equality before submission.
   * 
   * @returns {boolean} True if valid or in login mode, false otherwise.
   */
  const validatePasswords = () => {
    if (!isLogin) {
      if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
        setPasswordError("Password must be at least 8 characters and contain at least one uppercase letter and one number.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setPasswordError("Passwords do not match");
        return false;
      }
    }
    return true;
  };

  /**
   * Main form submission dispatcher for authenticating or registering the user.
   * 
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    const { confirmPassword: _confirmPassword, ...dataToSend } = formData;

    try {
      if (isLogin) {
        const data = await login(dataToSend);
        loginUser(data.user);
        const needsOnboarding = localStorage.getItem("munchmate_needs_onboarding");
        navigate(needsOnboarding ? ROUTES.ONBOARDING : ROUTES.HOME);
      } else {
        await signup(dataToSend);
        localStorage.setItem("munchmate_needs_onboarding", "true");
        setIsLogin(true);
        navigate(AUTH_ROUTES.LOGIN);
      }
    } catch (err) {
      setServerError(getErrorMessage(err, "Something went wrong. Please try again."));
    }
  };

  return (
    <div className="auth-page">
      <AuthLeftPanel />

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
              <AuthInputField
                label="First name"
                type="text"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              <AuthInputField
                label="Last name"
                type="text"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>
          )}

          <AuthInputField
            label="Email"
            type="email"
            name="email"
            placeholder="hello@example.com"
            value={formData.email}
            onChange={handleInputChange}
          />

          <AuthInputField
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
          />

          {isLogin && (
            <div className="auth-forgot-password">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate(ROUTES.RECOVERY); }}>
                Forgot your password?
              </a>
            </div>
          )}

          {!isLogin && (
            <AuthInputField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={passwordError}
            />
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
          <button className="auth-toggle-btn" onClick={toggleForm} type="button">
            {isLogin ? " Sign Up" : " Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;