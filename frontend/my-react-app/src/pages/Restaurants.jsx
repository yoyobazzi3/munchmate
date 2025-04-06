import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Filter from "../components/Filter";
import SearchBar from "../components/SearchBar";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./Restaurants.css";

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 12; // Changed from 9 to 12 restaurants per page

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
  
      // Optional client-side rating filter
      if (filters.minRating) {
        data = data.filter((r) => r.rating >= parseFloat(filters.minRating));
      }
      
      // Set total results for pagination
      setTotalResults(data.length);
      setTotalPages(Math.ceil(data.length / resultsPerPage));
      
      // Reset to first page when filters change
      setCurrentPage(1);
      
      setRestaurants(data);
  
      // Save the fetched restaurants to your database
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/saveRestaurants`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
    } catch (err) {
      console.error("Error fetching or saving restaurants:", err);
      setError("Failed to load restaurants. Please try again.");
    }
  
    setLoading(false);
  }, [filters]);

  // Fetch recently viewed restaurants
  const fetchRecentlyViewed = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!user?.id) return;
      
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/clickHistory/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.length > 0) {
        setRecentlyViewed(response.data);
      }
    } catch (err) {
      console.error("Error fetching click history:", err);
      // Not showing error to user as this is an enhancement, not core functionality
    }
  }, []);

  // Generate recommended restaurants based on user's previous selections
  const generateRecommendations = useCallback(() => {
    // Only generate recommendations if we have recent views
    if (recentlyViewed.length === 0 || restaurants.length === 0) return;

    // Get cuisines from recently viewed restaurants
    const recentCuisines = new Set();
    recentlyViewed.forEach(restaurant => {
      if (restaurant.categories) {
        restaurant.categories.forEach(category => {
          recentCuisines.add(category.alias);
        });
      }
    });

    // Filter restaurants that match recent cuisines, excluding already viewed ones
    const viewedIds = new Set(recentlyViewed.map(r => r.id));
    const recommended = restaurants.filter(restaurant => {
      if (viewedIds.has(restaurant.id)) return false;
      
      let matchesCuisine = false;
      if (restaurant.categories) {
        restaurant.categories.forEach(category => {
          if (recentCuisines.has(category.alias)) {
            matchesCuisine = true;
          }
        });
      }
      return matchesCuisine;
    });

    // Sort by rating and take top results
    const sortedRecommended = [...recommended].sort((a, b) => b.rating - a.rating);
    setRecommendedRestaurants(sortedRecommended.slice(0, 5));
  }, [recentlyViewed, restaurants]);

  useEffect(() => {
    fetchRestaurants();
    fetchRecentlyViewed();
  }, [fetchRestaurants, fetchRecentlyViewed]);

  // Generate recommendations whenever restaurants or recent views change
  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

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
        
        // Refresh recently viewed after tracking click
        fetchRecentlyViewed();
      } catch (err) {
        console.error("Tracking click failed:", err);
      }
    };

    trackClick();
  }, [selectedRestaurantId, fetchRecentlyViewed]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll to top of results
      document.querySelector('.restaurant-results').scrollTop = 0;
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll to top of results
      document.querySelector('.restaurant-results').scrollTop = 0;
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
    // Scroll to top of results
    document.querySelector('.restaurant-results').scrollTop = 0;
  };

  // Get current page of restaurants
  const getCurrentPageRestaurants = () => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return restaurants.slice(startIndex, endIndex);
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Show at most 5 page numbers
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // Restaurant card component to avoid repetition
  const RestaurantCard = ({ restaurant }) => (
    <div
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
  );

  return (
    <div className="restaurants-page">
      <aside className="filter-sidebar">
        <Filter onApply={handleApplyFilters} />
      </aside>

      <section className="restaurant-results">
        <SearchBar onSearch={handleSearch} />

        {/* Recommended Restaurants Section */}
        {recommendedRestaurants.length > 0 && (
          <div className="restaurant-section">
            <h2>Recommended For You</h2>
            <div className="restaurant-row">
              {recommendedRestaurants.map((restaurant) => (
                <RestaurantCard key={`rec-${restaurant.id}`} restaurant={restaurant} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <div className="restaurant-section">
            <h2>Recently Viewed</h2>
            <div className="restaurant-row">
              {recentlyViewed.slice(0, 5).map((restaurant) => (
                <RestaurantCard key={`recent-${restaurant.id}`} restaurant={restaurant} />
              ))}
            </div>
          </div>
        )}

        {/* Main Restaurant Results */}
        <div className="restaurant-section">
          <h2>Nearby Restaurants</h2>
          {loading && <p className="loading-message">Loading...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !error && (
            <>
              {restaurants.length === 0 ? (
                <p className="empty-message">No restaurants found. Try adjusting your filters.</p>
              ) : (
                <>
                  <div className="results-summary">
                    Showing {Math.min((currentPage - 1) * resultsPerPage + 1, totalResults)} - {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults} restaurants
                  </div>
                  
                  <div className="restaurant-grid">
                    {getCurrentPageRestaurants().map((restaurant) => (
                      <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button 
                        className="pagination-arrow" 
                        onClick={handlePrevPage} 
                        disabled={currentPage === 1}
                      >
                        <FaChevronLeft />
                      </button>
                      
                      {getPaginationNumbers().map(page => (
                        <button 
                          key={page} 
                          className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                          onClick={() => handlePageClick(page)}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button 
                        className="pagination-arrow" 
                        onClick={handleNextPage} 
                        disabled={currentPage === totalPages}
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Restaurant Details Modal */}
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