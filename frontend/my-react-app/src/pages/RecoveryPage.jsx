import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RecoveryPage.css";

const RecoveryPage = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = email entry, 2 = password reset
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/forgot-password`, { email });
      setMessage("Reset link sent to your email. Please check your inbox.");
      setStep(2);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error sending reset email");
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/reset-password`, {
        email,
        newPassword
      });
      setMessage("Password reset successfully!");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed");
    }
    setIsLoading(false);
  };

  return (
    <div className="recovery-container">
      <div className="recovery-card">
        <h2>Password Recovery</h2>
        
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {message && <div className="status-message">{message}</div>}

        <div className="auth-links">
          <button onClick={() => navigate("/auth")}>
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryPage;

