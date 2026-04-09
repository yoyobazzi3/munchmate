import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RecoveryPage.css";

const RecoveryPage = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = email, 2 = code + new password
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [devCode, setDevCode] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/forgot-password`,
        { email }
      );
      setMessage(res.data.message);
      if (res.data.devCode) setDevCode(res.data.devCode);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Error sending reset code.");
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/reset-password`,
        { email, code, newPassword }
      );
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/auth?mode=login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Password reset failed.");
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
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="hello@example.com"
                required
              />
            </div>
            {error && <p className="recovery-error">{error}</p>}
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset}>
            {message && <p className="recovery-success">{message}</p>}
            {devCode && (
              <div className="dev-code-box">
                Your reset code: <strong>{devCode}</strong>
              </div>
            )}
            <div className="input-group">
              <label>Reset Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(""); }}
                placeholder="6-digit code"
                maxLength={6}
                required
              />
            </div>
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                placeholder="........"
                required
              />
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="........"
                required
              />
            </div>
            {error && <p className="recovery-error">{error}</p>}
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="auth-links">
          <button onClick={() => navigate("/auth?mode=login")}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryPage;
