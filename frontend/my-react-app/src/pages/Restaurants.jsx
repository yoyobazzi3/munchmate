import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getUserLocation } from "../utils/getLocation"; // Assuming this utility exists
import Filter from "../components/Filter"; // Assuming this component exists
import SearchBar from "../components/SearchBar"; // Assuming this component exists
import RestaurantDetailsModal from "../components/RestaurantDetailsModal"; // Assuming this component exists
import { FaChevronLeft, FaChevronRight, FaUtensils, FaRegUser } from "react-icons/fa";
import "./Restaurants.css";

const Restaurants = () => {
  const navigate = useNavigate();
  const locationData = useLocation();
  const navState = locationData.state || {};

  const userTypedLocation = navState.location || "";
  const userSelectedCuisine = navState.cuisine || "";

  const [initialLocation] = useState(userTypedLocation);
  const [initialCuisine] = useState(userSelectedCuisine);

  const [filters, setFilters] = useState({
    latitude: null,
    longitude: null,
    location: userTypedLocation,
    category: userSelectedCuisine,
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

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    if (userTypedLocation) {
      setFilters(f => ({ ...f, location: userTypedLocation, latitude: null, longitude: null }));
    } else {
      getUserLocation()
        .then(coords => {
          setFilters(f => ({ ...f, latitude: coords.latitude, longitude: coords.longitude, location: "" }));
        })
        .catch(() => {
          setLoading(false);
          setInitialLoad(false);
          setError("Unable to get your location. Please enter it manually or enable location services.");
        });
    }
  }, [userTypedLocation]);

  useEffect(() => {
    if (navState.openFilters) {
      const sidebar = document.querySelector(".filter-sidebar");
      if (sidebar) {
        sidebar.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [navState]);

  const fetchRestaurants = useCallback(async () => {
    if ((!filters.location || filters.location.trim() === "") && (!filters.latitude || !filters.longitude)) {
      setRestaurants([]);
      setTotalResults(0);
      setTotalPages(1);
      setCurrentPage(1);
      setLoading(false);
      setInitialLoad(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const params = { ...filters, limit: 50, offset: 0 }; 
      
      const res = await axios.get(
        `${backendUrl}/getRestaurants`,
        { headers: { Authorization: `Bearer ${token}` }, params: params }
      );

      let data = res.data.businesses || res.data || [];
      if (!Array.isArray(data)) data = [];

      if (filters.minRating) {
        data = data.filter(r => r.rating >= parseFloat(filters.minRating));
      }

      setTotalResults(data.length); 
      setTotalPages(Math.ceil(data.length / resultsPerPage));
      setCurrentPage(1); 
      setRestaurants(data);

      if (data.length > 0 && token) {
        axios.post(
          `${backendUrl}/saveRestaurants`, 
          { restaurants: data }, 
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => console.error("Error saving restaurants:", err));
      }
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError("Failed to load restaurants. Please try again or adjust your search.");
      setRestaurants([]); 
      setTotalResults(0);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [filters, backendUrl, resultsPerPage]);

  const fetchRecentlyViewed = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");
      if (!token || !userString) return;
      const user = JSON.parse(userString);
      if (!user?.id) return;

      const res = await axios.get(
        `${backendUrl}/clickHistory/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.length) setRecentlyViewed(res.data);
      else setRecentlyViewed([]);
    } catch (err) { 
        console.error("Error fetching click history:", err); 
        setRecentlyViewed([]);
    }
  }, [backendUrl]);

  const generateRecommendations = useCallback(() => {
    if (!restaurants.length) { 
        setRecommendedRestaurants([]);
        return;
    }
    if (!recentlyViewed.length ) { 
        const topRated = [...restaurants].sort((a,b) => b.rating - a.rating).slice(0,5);
        setRecommendedRestaurants(topRated.filter(r => restaurants.find(mainR => mainR.id === r.id))); 
        return;
    }

    const viewedIds = new Set(recentlyViewed.map(r => r.restaurant_id || r.id)); 
    const recentCategories = new Set(
        recentlyViewed.flatMap(r => r.categories?.map(c => c.alias) || [])
    );

    let recommended = restaurants.filter(r => !viewedIds.has(r.id)); 

    if (recentCategories.size > 0) {
        recommended = recommended.filter(r => 
            r.categories?.some(c => recentCategories.has(c.alias))
        );
    }
    
    recommended.sort((a, b) => b.rating - a.rating); 
    setRecommendedRestaurants(recommended.slice(0, 5));

  }, [recentlyViewed, restaurants]);

  useEffect(() => {
    fetchRestaurants();
    fetchRecentlyViewed();
  }, [fetchRestaurants, fetchRecentlyViewed]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  const handleApplyFilters = newFilters => {
    setCurrentPage(1); 
    setFilters(f => ({ ...f, ...newFilters }));
  };

  const handleSearch = searchValue => {
    setCurrentPage(1); 
    const term = typeof searchValue === "object" && searchValue.text ? searchValue.text :
                 typeof searchValue === "string" ? searchValue : "";
    setFilters(f => ({ 
        ...f, 
        term: term, 
        location: (typeof searchValue === 'object' && searchValue.location) || f.location, 
        category: (typeof searchValue === 'object' && searchValue.cuisine) || f.category 
    }));
  };

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!selectedRestaurantId || !userString) return;

    const user = JSON.parse(userString);
    if (!user?.id) return;

    (async () => {
      try {
        const token = localStorage.getItem("token");
        await axios.post(`${backendUrl}/trackClick`, {
          user_id: user.id,
          restaurant_id: selectedRestaurantId
        }, { headers: { Authorization: `Bearer ${token}` } }); 
        fetchRecentlyViewed(); 
      } catch (err) { console.error("Tracking click failed:", err); }
    })();
  }, [selectedRestaurantId, fetchRecentlyViewed, backendUrl]);

  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsProfileDropdownOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getCurrentPageRestaurants = () => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    return restaurants.slice(startIndex, startIndex + resultsPerPage);
  };

  const getPaginationNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // MODIFIED RestaurantCard to include description
  const RestaurantCard = ({ restaurant }) => {
    const description = restaurant.categories && restaurant.categories.length > 0
      ? restaurant.categories.map(cat => cat.title).join(', ')
      : "No description available."; // Fallback description

    return (
      <div className="restaurant-card" onClick={() => setSelectedRestaurantId(restaurant.id)}>
        <img
          src={restaurant.image_url || "https://via.placeholder.com/200x160?text=No+Image"}
          alt={restaurant.name || "Restaurant"}
          className="restaurant-image"
          onError={(e) => { e.target.src = "https://via.placeholder.com/200x160?text=No+Image"; }}
        />
        <h3>{restaurant.name || "N/A"}</h3>
        {/* Displaying categories as the description */}
        {restaurant.categories && restaurant.categories.length > 0 && (
            <p className="restaurant-description">{description}</p>
        )}
        <p>⭐ {restaurant.rating || "N/A"} ({restaurant.review_count || 0})</p>
        <p>{restaurant.price || "Price N/A"}</p>
        <p>{restaurant.location?.address1 || restaurant.location?.display_address?.join(', ') || "Address N/A"}</p>
      </div>
    );
  };

  const LoadingState = () => (
    <div className="loading-container">
      <div className="loading-animation"><FaUtensils className="loading-icon" /></div>
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
      <button className="retry-button" onClick={fetchRestaurants}>Try Again</button>
    </div>
  );

  return (
    <div className="restaurants-page">
      <div className="top-nav">
        <div className="arrow-container" onClick={() => navigate(-1)}> 
          <FaChevronLeft className="arrow-icon" />
        </div>
        <div className="logo">
          <img src="/logoM.png" alt="Logo" className="logo-icon" />
          <span className="logo-text">MunchMate</span>
        </div>
        <div className="profile-section-restaurants" ref={profileDropdownRef}>
          <FaRegUser className="profile-icon-restaurants" onClick={toggleProfileDropdown} />
          {isProfileDropdownOpen && (
            <div className="profile-dropdown-restaurants">
              <button onClick={handleSignOut} className="dropdown-button-restaurants">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="restaurants-container">
        <aside className="filter-sidebar">
          <Filter 
            onApply={handleApplyFilters} 
            initialFilters={{ category: initialCuisine, location: initialLocation }}
          />
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
                {recommendedRestaurants.map(r => (
                  <RestaurantCard key={`rec-${r.id}`} restaurant={r} />
                ))}
              </div>
            </div>
          )}

          {recentlyViewed.length > 0 && (
            <div className="restaurant-section">
              <h2>Recently Viewed</h2>
              <div className="restaurant-row">
                {recentlyViewed.slice(0, 5).map(r => (
                  <RestaurantCard key={`recent-${r.id || r.restaurant_id}`} restaurant={r.restaurantDetails || r} />
                ))}
              </div>
            </div>
          )}
          
          <div className="restaurant-section"> 
            <h2>{filters.term ? `Results for "${filters.term}"` : "Nearby Restaurants"}</h2>
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} />
            ) : restaurants.length > 0 ? (
              <>
                <div className="results-summary">
                  Showing {Math.min((currentPage - 1) * resultsPerPage + 1, totalResults)} -{" "}
                  {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults} restaurants
                </div>
                <div className="restaurant-grid">
                  {getCurrentPageRestaurants().map(r => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="pagination-arrow"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}>
                      <FaChevronLeft />
                    </button>
                    {getPaginationNumbers().map(p => (
                      <button key={p}
                              className={`pagination-number ${p === currentPage ? "active" : ""}`}
                              onClick={() => setCurrentPage(p)}>
                        {p}
                      </button>
                    ))}
                    <button className="pagination-arrow"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}>
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            ) : !initialLoad ? ( 
              <EmptyResultsState />
            ) : null 
            }
          </div>
        </section>
      </div>

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