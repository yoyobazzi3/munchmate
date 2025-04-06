import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./Auth.css";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Read the mode from query params
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get("mode");

  const [isLogin, setIsLogin] = useState(mode === "login");
  const [formData, setFormData] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    password: "",
    confirmPassword: "" 
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setIsLogin(mode === "login");
  }, [mode]);

  const toggleForm = () => {
    setIsLogin(!isLogin);
    navigate(`/auth?mode=${!isLogin ? "login" : "signup"}`);
    // Reset error when toggling
    setPasswordError("");
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear password error when user types in either password field
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
    
    // Validate passwords match for signup
    if (!validatePasswords()) {
      return;
    }
    
    const endpoint = isLogin ? "/login" : "/signup";
    
    // Remove confirmPassword from the data sent to server
    const { confirmPassword, ...dataToSend } = formData;

    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    });

    const data = await response.json();
    if (response.ok) {
      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/home");
      } else {
        setIsLogin(true);
        navigate("/auth?mode=login");
      }
    } else {
      console.error("Error:", data.error);
    }
  };

  return (
    <div className="auth-page">
      {/* Navigation Bar */}
      <div className="auth-nav">
        <div className="auth-nav-logo">
          <Link to="/">MunchMate</Link>
        </div>
      </div>

      <div className="auth-container">
        <div className="back-to-home">
          <Link to="/">
            <span className="back-arrow">←</span> Back to Landing Page
          </Link>
        </div>
        
        <div className="auth-header">
          <h1>MunchMate</h1>
          <p>Find your perfect food companion</p>
        </div>
        
        <div className="auth-form">
          <h2>{isLogin ? "Sign In" : "Create an account"}</h2>
          <p>Enter your details to get started with MunchMate</p>
          <form onSubmit={handleFormSubmit}>
            {!isLogin && (
              <>
                <div className="input-group">
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
                <div className="input-group">
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
              </>
            )}
            <div className="input-group">
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
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                placeholder="........" 
                value={formData.password}
                onChange={handleInputChange} 
                required 
              />
            </div>
            {!isLogin && (
              <div className="input-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  placeholder="........" 
                  value={formData.confirmPassword}
                  onChange={handleInputChange} 
                  required 
                />
                {passwordError && <p className="error-message">{passwordError}</p>}
              </div>
            )}
            {!isLogin && (
              <div className="checkbox-group">
                <input type="checkbox" name="agree" required />
                <label>I agree to the Terms of Service and Privacy Policy</label>
              </div>
            )}
            <button type="submit" className="submit-button">
              {isLogin ? "Sign In" : "Create account"}
            </button>
          </form>
          <p className="toggle-form-text">
            {isLogin ? "Need an account? " : "Already have an account? "}
            <button className="toggle-button" onClick={toggleForm}>
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;