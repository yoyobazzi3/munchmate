import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Recommendations.css';

const Recommendations = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [randomRecommendation, setRandomRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fetching recommendations from an API
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data - replace with actual API call later
        const mockData = [
          { id: 1, name: "Vegetarian Pasta", restaurant: "Italian Bistro", type: "Italian" },
          { id: 2, name: "California Roll", restaurant: "Sushi Palace", type: "Japanese" },
          { id: 3, name: "BBQ Burger", restaurant: "Grill House", type: "American" },
        ];

        setRecommendations(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleSurpriseMe = () => {
    if (recommendations.length > 0) {
      const randomIndex = Math.floor(Math.random() * recommendations.length);
      setRandomRecommendation(recommendations[randomIndex]);
    }
  };

  const handleViewDetails = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="recommendations-container">
      <h2>Personalized Recommendations</h2>

      {isLoading ? (
        <p>Loading recommendations...</p>
      ) : (
        <>
          <button
            className="surprise-me-button"
            onClick={handleSurpriseMe}
            disabled={recommendations.length === 0}
          >
            🎲 Surprise Me!
          </button>

          {randomRecommendation && (
            <div className="recommendation-result">
              <h3>We recommend:</h3>
              <p className="highlight">{randomRecommendation.name}</p>
              <p>from {randomRecommendation.restaurant}</p>
              <p className="cuisine-tag">{randomRecommendation.type} cuisine</p>
              <button
                className="view-details-button"
                onClick={() => handleViewDetails(randomRecommendation.id)}
              >
                View Details
              </button>
            </div>
          )}

          <div className="recommendations-list">
            <h3>Previous Recommendations</h3>
            {recommendations.length > 0 ? (
              recommendations.map((item) => (
                <div key={item.id} className="recommendation-item">
                  <p>{item.name} - {item.restaurant}</p>
                  <button
                    className="view-details-button"
                    onClick={() => handleViewDetails(item.id)}
                  >
                    View Details
                  </button>
                </div>
              ))
            ) : (
              <p>No recommendations found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Recommendations;
