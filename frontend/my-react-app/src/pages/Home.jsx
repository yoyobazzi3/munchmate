import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Import styles

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to MunchMate</h1>
      <p className="home-subtitle">
        Discover the best restaurants around you and get AI-powered food recommendations!
      </p>

      <div className="button-group">
        <button onClick={() => navigate("/restaurants")}>Find Restaurants</button>
        <button onClick={() => navigate("/recommendations")}>Get AI Recommendation</button>
      </div>

      <footer className="home-footer">
        <p>Powered by Google Maps & OpenAI</p>
      </footer>
    </div>
  );
};

export default Home;