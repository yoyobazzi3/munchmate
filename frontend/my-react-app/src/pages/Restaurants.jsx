import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getUserLocation } from "../utils/getLocation";
import Filter from "../components/Filter";
import SearchBar from "../components/SearchBar";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import { FaChevronLeft, FaChevronRight, FaUtensils } from "react-icons/fa";
import "./Restaurants.css";

const Restaurants = () => {
  const navigate = useNavigate();
  const locationData = useLocation();
  const navState = locationData.state || {};

  // Retrieve the custom location (if provided) and selected cuisine from Home.
  const userTypedLocation = navState.location || "";
  const userSelectedCuisine = navState.cuisine || "";

  const [initialLocation, setInitialLocation] = useState(userTypedLocation);
  const [initialCuisine, setInitialCuisine] = useState(userSelectedCuisine);

  // Set up filters. If a location string was provided, pass that to the backend.
  const [filters, setFilters] = useState({
    latitude: null,
    longitude: null,
    location: userTypedLocation, // custom city if provided
    category: userSelectedCuisine, // cuisine filter
    price: "",
    radius: 5000,
    sortBy: "best_match",
    minRating: "",
    term: ""
  });

  const [restaurants, setRestaurants] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 12;

  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  // If the user typed a location, use it. Otherwise, fallback to geolocation.
  useEffect(() => {
    if (userTypedLocation) {
      setFilters((prev) => ({
        ...prev,
        location: userTypedLocation,
        latitude: null,
        longitude: null
      }));
    } else {
      getUserLocation()
        .then((coords) => {
          setFilters((prev) => ({
            ...prev,
            latitude: coords.latitude,
            longitude: coords.longitude,
            location: ""
          }));
        })
        .catch((err) => {
          setError("Unable to get your location. Please enter it manually or try again.");
        });
    }
  }, [userTypedLocation]);

  // If the openFilters flag is present, scroll the Filter sidebar into view.
  useEffect(() => {
    if (navState.openFilters) {
      const filterSidebar = document.querySelector(".filter-sidebar");
      if (filterSidebar) {
        filterSidebar.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [navState]);

  const fetchRestaurants = useCallback(async () => {
    // Proceed if either location text is provided or lat/lon are available.
    if (!filters.location && (!filters.latitude || !filters.longitude)) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/getRestaurants`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: filters,
        }
      );
      let data = response.data;
      if (filters.minRating) {
        data = data.filter((r) => r.rating >= parseFloat(filters.minRating));
      }
      setTotalResults(data.length);
      setTotalPages(Math.ceil(data.length / resultsPerPage));
      setCurrentPage(1);
      setRestaurants(data);
      setInitialLoad(false);
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/saveRestaurants`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError("Failed to load restaurants. Please try again.");
      setInitialLoad(false);
    }
    setLoading(false);
  }, [filters]);

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
    }
  }, []);

  const generateRecommendations = useCallback(() => {
    if (recentlyViewed.length === 0 || restaurants.length === 0) return;
    const recentCuisines = new Set();
    recentlyViewed.forEach((restaurant) => {
      if (restaurant.categories) {
        restaurant.categories.forEach((category) => {
          recentCuisines.add(category.alias);
        });
      }
    });
    const viewedIds = new Set(recentlyViewed.map((r) => r.id));
    const recommended = restaurants.filter((restaurant) => {
      if (viewedIds.has(restaurant.id)) return false;
      let matchesCuisine = false;
      if (restaurant.categories) {
        restaurant.categories.forEach((category) => {
          if (recentCuisines.has(category.alias)) {
            matchesCuisine = true;
          }
        });
      }
      return matchesCuisine;
    });
    const sortedRecommended = [...recommended].sort((a, b) => b.rating - a.rating);
    setRecommendedRestaurants(sortedRecommended.slice(0, 5));
  }, [recentlyViewed, restaurants]);

  useEffect(() => {
    fetchRestaurants();
    fetchRecentlyViewed();
  }, [fetchRestaurants, fetchRecentlyViewed]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  const handleApplyFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Update search term (e.g., from the SearchBar) – you might modify this if you want to update location as well.
  const handleSearch = (searchValue) => {
    if (typeof searchValue === "object" && searchValue.text) {
      setFilters((prev) => ({ ...prev, term: searchValue.text }));
    } else if (typeof searchValue === "string") {
      // If the user edits the search text on the Restaurants page, you can decide whether to update "term"
      // or even allow editing the location string. For now, we update term only.
      setFilters((prev) => ({ ...prev, term: searchValue }));
    }
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
        fetchRecentlyViewed();
      } catch (err) {
        console.error("Tracking click failed:", err);
      }
    };
    trackClick();
  }, [selectedRestaurantId, fetchRecentlyViewed]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      document.querySelector(".restaurant-results").scrollTop = 0;
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      document.querySelector(".restaurant-results").scrollTop = 0;
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
    document.querySelector(".restaurant-results").scrollTop = 0;
  };

  const getCurrentPageRestaurants = () => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    return restaurants.slice(startIndex, startIndex + resultsPerPage);
  };

  const getPaginationNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
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

  const RestaurantCard = ({ restaurant }) => (
    <div className="restaurant-card" onClick={() => setSelectedRestaurantId(restaurant.id)}>
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

  const LoadingState = () => (
    <div className="loading-container">
      <div className="loading-animation">
        <FaUtensils className="loading-icon" />
      </div>
      <p className="loading-text">Finding delicious restaurants near you...</p>
    </div>
  );

  const EmptyResultsState = () => (
    <div className="empty-results-container">
      <div className="empty-icon">🍽️</div>
      <h3>No Restaurants Found</h3>
      <p>We couldn’t find any restaurants matching your criteria.</p>
      <p>Try adjusting your filters or search terms.</p>
    </div>
  );

  const ErrorState = ({ message }) => (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3>Oops! Something went wrong</h3>
      <p>{message}</p>
      <button className="retry-button" onClick={fetchRestaurants}>
        Try Again
      </button>
    </div>
  );

  return (
    <div className="restaurants-page">
      {/* Fixed Navbar */}
      <div className="top-nav">
        <div className="arrow-container" onClick={() => navigate("/")}>
          <FaChevronLeft className="arrow-icon" />
        </div>
        <div className="center-logo">
          <img src="/logo.png" alt="MunchMate Logo" className="logo-icon" />
          <span className="logo-text">MunchMate</span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="restaurants-container">
        <aside className="filter-sidebar">
          <Filter onApply={handleApplyFilters} />
        </aside>
        <section className="restaurant-results">
          <SearchBar
            onSearch={handleSearch}
            initialLocation={initialLocation}
            initialCuisine={initialCuisine}
          />

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

          <div className="restaurant-section">
            <h2>Nearby Restaurants</h2>
            {initialLoad && loading && <LoadingState />}
            {error && <ErrorState message={error} />}
            {!initialLoad && !loading && !error && (
              <>
                {restaurants.length === 0 ? (
                  <EmptyResultsState />
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
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button className="pagination-arrow" onClick={handlePrevPage} disabled={currentPage === 1}>
                          <FaChevronLeft />
                        </button>
                        {getPaginationNumbers().map((page) => (
                          <button key={page} className={`pagination-number ${page === currentPage ? "active" : ""}`} onClick={() => handlePageClick(page)}>
                            {page}
                          </button>
                        ))}
                        <button className="pagination-arrow" onClick={handleNextPage} disabled={currentPage === totalPages}>
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
      </div>

      {selectedRestaurantId && (
        <RestaurantDetailsModal id={selectedRestaurantId} onClose={() => setSelectedRestaurantId(null)} />
      )}
    </div>
  );
};

export default Restaurants;
