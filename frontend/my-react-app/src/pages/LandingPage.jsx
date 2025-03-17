import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import "./LandingPage.css";


const LandingPage = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleFindRestaurants = () => {
    navigate(`/restaurants?location=${location}&query=${searchQuery}`);
  };

  return (
    <div className="landing-page">
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="logo">
          <img src="/logo.png" alt="Logo" className="logo-icon" />
          <span className="logo-text">MunchMate</span>
        </div>
        <div className="nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span onClick={() => navigate("/discover")}>Discover</span>
          <span onClick={() => navigate("/cuisines")}>Cuisines</span>
          <span onClick={() => navigate("/about")}>About</span>
        </div>
        <div className="auth-buttons">
          <button className="login-btn" onClick={() => navigate("/login")}>
            Log in
          </button>
          <button className="signup-btn" onClick={() => navigate("/signup")}>
            Sign up
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="main-title">Discover Delicious Food</h1>
        <h1 className="main-title bold-black">Near You</h1>
        <p className="subtext">Find the perfect restaurant based on your location, preferences, and cravings.</p>

        {/* Search Fields */}
        <div className="search-container">
          <div className="input-icon-group">
            <FaMapMarkerAlt className="input-icon" />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="input-icon-group">
            <FaSearch className="input-icon" />
            <input
              type="text"
              placeholder="Cuisine, restaurant, or dish"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="search-btn" onClick={handleFindRestaurants}>
            Find Restaurants
          </button>
        </div>
      </div>

      {/* Scrollable How It Works Section */}
      <div id="how-it-works" className="how-it-works">
        <h2>How It Works</h2>
        <div className="how-it-works-content">
          <div className="step">
            <img src="/location-icon.png" alt="Location Icon" className="step-icon" />
            <h3>Share Your Location</h3>
            <p>Enable location services or enter your address to find restaurants nearby.</p>
          </div>
          <div className="step">
            <img src="/filter-icon.png" alt="Filter Icon" className="step-icon" />
            <h3>Set Your Preferences</h3>
            <p>Filter by cuisine, price range, dietary restrictions, and more.</p>
          </div>
          <div className="step">
            <img src="/star-icon.png" alt="Star Icon" className="step-icon" />
            <h3>Discover & Enjoy</h3>
            <p>Browse personalized recommendations and enjoy your perfect meal.</p>
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

