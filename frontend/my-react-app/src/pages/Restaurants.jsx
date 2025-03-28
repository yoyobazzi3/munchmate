import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Filter from "../components/Filter";
import SearchBar from "../components/SearchBar";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import "./Restaurants.css";

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({
    latitude: null,
    longitude: null,
    category: "",
    price: "",
    radius: 5000,
    sortBy: "best_match",
    minRating: "",
    term: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  // Get user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, []);

  // Fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    if (!filters.latitude || !filters.longitude) return;
  
    setLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/getRestaurants`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      });
  
      let data = response.data;
  
      // ✅ Optional client-side rating filter
      if (filters.minRating) {
        data = data.filter((r) => r.rating >= parseFloat(filters.minRating));
      }
  
      setRestaurants(data);
  
      // ✅ Save the fetched restaurants to your database
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/saveRestaurants`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
    } catch (err) {
      console.error("Error fetching or saving restaurants:", err);
      setError("Failed to load restaurants. Please try again.");
    }
  
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleApplyFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSearch = (term) => {
    setFilters((prev) => ({ ...prev, term }));
  };

  useEffect(() => {
    const trackClick = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!selectedRestaurantId || !user?.id) return;

      try {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/trackClick`, {
          user_id: user.id,
          restaurant_id: selectedRestaurantId,
        });
      } catch (err) {
        console.error("Tracking click failed:", err);
      }
    };

    trackClick();
  }, [selectedRestaurantId]);

  return (
    <div className="restaurants-page">
      <aside className="filter-sidebar">
        <Filter onApply={handleApplyFilters} />
      </aside>

      <section className="restaurant-results">
        <SearchBar onSearch={handleSearch} />
        <h2>Nearby Restaurants</h2>

        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}

        <div className="restaurant-list">
          {restaurants.length === 0 && !loading ? (
            <p>No results found.</p>
          ) : (
            restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="restaurant-card"
                onClick={() => setSelectedRestaurantId(restaurant.id)}
              >
                <img
                  src={restaurant.image_url || "https://via.placeholder.com/200"}
                  alt={restaurant.name}
                  className="restaurant-image"
                />
                <h3>{restaurant.name}</h3>
                <p>⭐ {restaurant.rating} ({restaurant.review_count})</p>
                <p>{restaurant.price || "N/A"}</p>
                <p>{restaurant.location?.address1}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {selectedRestaurantId && (
        <RestaurantDetailsModal
          id={selectedRestaurantId}
          onClose={() => setSelectedRestaurantId(null)}
        />
      )}
    </div>
  );
};

export default Restaurants;