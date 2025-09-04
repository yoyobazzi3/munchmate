import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="logo">
          <img src="/logoM.png" alt="Logo" className="logo-icon" />
          <span className="logo-text">MunchMate</span>
        </div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#cuisines">Cuisines</a>
          <a href="#how-it-works">How It Works</a>
        </div>
        <div className="auth-buttons">
          <button
            className="login-btn"
            onClick={() => navigate("/auth?mode=login")}
          >
            Log in
          </button>
          <button
            className="signup-btn"
            onClick={() => navigate("/auth?mode=signup")}
          >
            Sign up
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div id="home" className="main-content">
        <h1 className="main-title">Discover Delicious Food</h1>
        <h1 className="main-title">Near You</h1>
        <p className="subtext">
          Find the perfect restaurant based on your location, preferences, and
          cravings.
        </p>
        <div className="cta-box">
          <button className="get-started-btn" onClick={() => navigate("/auth")}>
            Get Started
          </button>
        </div>
      </div>

      {/* Popular Categories Section */}
      <div id="cuisines" className="popular-categories">
        <h2 className="categories-title">Popular Cuisines</h2>
        <div className="categories-grid">
          <div
            className="category-card"
          >
            <div className="emoji">🍝</div>
            <h3>Italian</h3>
          </div>
          <div
            className="category-card"
          >
            <div className="emoji">🍣</div>
            <h3>Japanese</h3>
          </div>
          <div
            className="category-card"
          >
            <div className="emoji">🌮</div>
            <h3>Mexican</h3>
          </div>
          <div
            className="category-card"
          >
            <div className="emoji">🍛</div>
            <h3>Indian</h3>
          </div>
          <div
            className="category-card"
          >
            <div className="emoji">🥡</div>
            <h3>Chinese</h3>
          </div>
          <div
            className="category-card"
          >
            <div className="emoji">🍔</div>
            <h3>American</h3>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="how-it-works">
        <h2>How It Works</h2>
        <div className="how-it-works-content">
          <div className="step">
            <img
              src="/location-icon.png"
              alt="Location Icon"
              className="step-icon"
            />
            <h3>Share Your Location</h3>
            <p>
              Enable location services or enter your address to find restaurants
              nearby.
            </p>
          </div>
          <div className="step">
            <img
              src="/filter-icon.png"
              alt="Filter Icon"
              className="step-icon"
            />
            <h3>Set Your Preferences</h3>
            <p>
              Filter by cuisine, price range, dietary restrictions, and more.
            </p>
          </div>
          <div className="step">
            <img src="/star-icon.png" alt="Star Icon" className="step-icon" />
            <h3>Discover & Enjoy</h3>
            <p>
              Browse personalized recommendations and enjoy your perfect meal.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="footer">
        <p>© 2025 MunchMate. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LandingPage;