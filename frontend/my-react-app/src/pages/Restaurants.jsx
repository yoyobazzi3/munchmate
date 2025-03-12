import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RestaurantList.css';

const RestaurantList = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    cuisine: '',
    sortBy: 'distance',
  });

  // Simulate fetching restaurants from an API
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data - replace with actual API call later
        const mockData = [
          { id: 1, name: "Tasty Burger", cuisine: "American", rating: 4.5, distance: 0.8 },
          { id: 2, name: "Sushi Master", cuisine: "Japanese", rating: 4.8, distance: 1.2 },
          { id: 3, name: "Pizza Paradise", cuisine: "Italian", rating: 4.3, distance: 0.5 },
        ];

        setRestaurants(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch restaurants:", error);
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Sort and filter restaurants based on user selection
  const getFilteredRestaurants = () => {
    let filtered = [...restaurants];

    // Filter by cuisine
    if (filters.cuisine) {
      filtered = filtered.filter((restaurant) =>
        restaurant.cuisine.toLowerCase() === filters.cuisine.toLowerCase()
      );
    }

    // Sort by distance or rating
    if (filters.sortBy === 'distance') {
      filtered.sort((a, b) => a.distance - b.distance);
    } else if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  };

  const handleViewDetails = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="restaurant-list">
      <h2>Nearby Restaurants</h2>

      <div className="filters">
        <select
          name="cuisine"
          value={filters.cuisine}
          onChange={handleFilterChange}
        >
          <option value="">All Cuisines</option>
          <option value="American">American</option>
          <option value="Japanese">Japanese</option>
          <option value="Italian">Italian</option>
        </select>

        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleFilterChange}
        >
          <option value="distance">Sort by Distance</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      {isLoading ? (
        <p>Loading restaurants...</p>
      ) : (
        <div className="results">
          {getFilteredRestaurants().length > 0 ? (
            getFilteredRestaurants().map((restaurant) => (
              <div
                key={restaurant.id}
                className="restaurant-card"
                onClick={() => handleViewDetails(restaurant.id)}
              >
                <h3>{restaurant.name}</h3>
                <p>Cuisine: {restaurant.cuisine}</p>
                <p>⭐ {restaurant.rating} | 🚶♂️ {restaurant.distance} km</p>
                <button
                  className="view-details-button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click event
                    handleViewDetails(restaurant.id);
                  }}
                >
                  View Details
                </button>
              </div>
            ))
          ) : (
            <p>No restaurants found matching your filters.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantList;
