import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const navigate = useNavigate();

  const toggleForm = () => setIsLogin(!isLogin);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "/login" : "/signup";

    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (response.ok) {
      if (isLogin) {
        localStorage.setItem("token", data.token);
        navigate("/home"); // ✅ Redirects to home after login
      } else {
        setIsLogin(true); // ✅ Switch to login page after signup
      }
    } else {
      console.error("Error:", data.error);
    }
  };

  return (
    <div className="auth-container">
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
                <input type="text" name="firstName" placeholder="John" onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Last name</label>
                <input type="text" name="lastName" placeholder="Doe" onChange={handleInputChange} required />
              </div>
            </>
          )}
          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="hello@example.com" onChange={handleInputChange} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="........" onChange={handleInputChange} required />
          </div>
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
  );
};

export default Auth;