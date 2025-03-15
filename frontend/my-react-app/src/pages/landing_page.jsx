import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFindRestaurants = () => {
    // Navigate to the restaurant list page with search parameters
    navigate(`/restaurants?location=${location}&query=${searchQuery}`);
  };

  return (
    <div className="landing-page">
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="logo">
          <span className="icon">🍴</span>
          <span className="logo-text">fastenerby</span>
        </div>
        <div className="nav-links">
          <span onClick={() => navigate('/')}>Home</span>
          <span onClick={() => navigate('/discover')}>Discover</span>
          <span onClick={() => navigate('/cuisines')}>Cuisines</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>
          <span className="white-text">Discover Delicious Food</span>
          <span className="black-text"> Near You</span>
        </h1>
        <p className="subtext">
          Find the perfect restaurant based on your location, preferences, and cravings
        </p>

        {/* Search Fields */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Enter your location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            type="text"
            placeholder="Cuisine, restaurant, or dish"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleFindRestaurants}>Find restaurants</button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
