import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaSearch, FaCommentDots } from "react-icons/fa";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [cuisine, setCuisine] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Pass both the user-typed location and the selected cuisine
    navigate("/restaurants", { state: { location, cuisine } });
  };

  return (
    <div className="home-page">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="logo">
          <img src="/logo.png" alt="Logo" className="logo-icon" />
          <span className="logo-text">MunchMate</span>
        </div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#cuisines">Cuisines</a>
          <a href="#how-it-works">How It Works</a>
        </div>
        <div className="user-profile">
          <img
            src="/default-avatar.png"
            alt="Profile"
            className="profile-pic"
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>

      {/* Main Content */}
      <div id="home" className="main-content">
        <h1 className="main-title">Discover Delicious Food</h1>
        <h1 className="main-title second-line">Near You</h1>
        <p className="subtext">
          Find the perfect restaurant based on your location, preferences, and cravings.
        </p>

        <div className="search-container">
          <form onSubmit={handleSearch}>
            <div className="search-inputs">
              {/* Location Input */}
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="📍 Location" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              {/* Cuisine Dropdown */}
              <div className="input-group">
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="cuisine-select"
                >
                  <option value="">All Cuisines</option>
                  <option value="pizza">Pizza</option>
                  <option value="mexican">Mexican</option>
                  <option value="burgers">Burgers</option>
                  <option value="sushi">Sushi</option>
                  <option value="chinese">Chinese</option>
                  <option value="indian">Indian</option>
                  <option value="coffee">Coffee &amp; Tea</option>
                  <option value="bakery">Bakery</option>
                </select>
              </div>
              <button type="submit" className="search-btn">
                Find Restaurants
              </button>
            </div>
          </form>
        </div>

        <div className="ai-assistant">
          <p>Or try our AI-powered food assistant</p>
          <button 
            className="ai-chat-btn"
            onClick={() => navigate("/chatbot")}
          >
            <FaCommentDots className="btn-icon" /> Chat with MunchMate AI
          </button>
        </div>
      </div>

      {/* Popular Cuisines Section */}
      <div id="cuisines" className="popular-categories">
        <h2 className="categories-title">Popular Cuisines</h2>
        <div className="categories-grid">
          {/* Note: Route via /restaurants with a preselected cuisine and openFilters flag */}
          <div
            className="category-card"
            onClick={() => navigate("/restaurants", { state: { cuisine: "pizza", openFilters: true } })}
          >
            <div className="emoji">🍝</div>
            <h3>Italian</h3>
          </div>
          <div
            className="category-card"
            onClick={() => navigate("/restaurants", { state: { cuisine: "sushi", openFilters: true } })}
          >
            <div className="emoji">🍣</div>
            <h3>Japanese</h3>
          </div>
          <div
            className="category-card"
            onClick={() => navigate("/restaurants", { state: { cuisine: "mexican", openFilters: true } })}
          >
            <div className="emoji">🌮</div>
            <h3>Mexican</h3>
          </div>
          <div
            className="category-card"
            onClick={() => navigate("/restaurants", { state: { cuisine: "indian", openFilters: true } })}
          >
            <div className="emoji">🍛</div>
            <h3>Indian</h3>
          </div>
          <div
            className="category-card"
            onClick={() => navigate("/restaurants", { state: { cuisine: "chinese", openFilters: true } })}
          >
            <div className="emoji">🥡</div>
            <h3>Chinese</h3>
          </div>
          <div
            className="category-card"
            onClick={() => navigate("/restaurants", { state: { cuisine: "american", openFilters: true } })}
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
            <h3>Discover &amp; Enjoy</h3>
            <p>Browse personalized recommendations and enjoy your perfect meal.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>© 2025 MunchMate. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Home;
