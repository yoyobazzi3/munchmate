import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Filter from "../components/Filter";
import "./Restaurants.css";

const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes in milliseconds

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    lat: null,
    lng: null,
    radius: 5000,
    price: "",
    type: "restaurant",
    minRating: "",
  });

  // Pagination State (12 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Cache Key (Based on filters)
  const getCacheKey = () => {
    return `${filters.lat}-${filters.lng}-${filters.radius}-${filters.price}-${filters.type}-${filters.minRating}`;
  };

  // Get User's Location (Runs Once)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  }, []);

  // Fetch Restaurants (With Cache)
  const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

  const fetchRestaurants = useCallback(async (pageToken = null) => {
    if (filters.lat && filters.lng) {
      const cacheKey = `${filters.lat}-${filters.lng}-${filters.radius}-${filters.price}-${filters.type}-${filters.minRating}-${pageToken || "firstPage"}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cachedTimestamp = sessionStorage.getItem(`${cacheKey}-timestamp`);
  
      // ✅ Use cached data if available and not expired
      if (cachedData && cachedTimestamp && Date.now() - cachedTimestamp < CACHE_EXPIRATION) {
        console.log("✅ Using cached restaurants for:", cacheKey);
        const cachedResponse = JSON.parse(cachedData);
  
        setRestaurants((prev) => [...prev, ...cachedResponse.restaurants]);
        setNextPageToken(cachedResponse.nextPageToken || null);
        return;
      }
  
      setLoading(true);
      try {
        console.log("Fetching fresh data for:", cacheKey);
        const response = await axios.get("http://localhost:8000/getRestaurants", { params: { ...filters, pageToken } });
  
        // ✅ Store new results while keeping old ones
        setRestaurants((prev) => [...prev, ...(response.data.restaurants || [])]);
        setNextPageToken(response.data.nextPageToken || null);
  
        // ✅ Cache the fetched results
        sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
        sessionStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      }
      setLoading(false);
    }
  }, [filters]);

  // Run Fetch Only When Filters Change
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Memoized Restaurants for Faster Rendering (Now Paginating 12 Per Page)
  const currentRestaurants = useMemo(() => {
    const indexOfLastRestaurant = currentPage * itemsPerPage;
    const indexOfFirstRestaurant = indexOfLastRestaurant - itemsPerPage;
    return restaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant);
  }, [restaurants, currentPage]);

  return (
    <div className="restaurants-page">
      {/* Left Side: Filters */}
      <Filter onApply={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))} />

      {/* Right Side: Restaurants */}
      <div className="restaurants-section">
        {loading && <p>Loading...</p>}

        <div className="restaurant-list">
          {currentRestaurants.length === 0 ? (
            <p>No restaurants found.</p>
          ) : (
            currentRestaurants.map((restaurant) => (
              <div key={restaurant.place_id} className="restaurant-card">
                <img
                  src={restaurant.photoUrl}
                  alt={restaurant.name}
                  className="restaurant-image"
                  loading="lazy"
                />
                <h3>{restaurant.name}</h3>
                <p>{restaurant.rating} ⭐</p>
                <p>{restaurant.price_level ? "$".repeat(restaurant.price_level) : "N/A"}</p>
                <p>{restaurant.address}</p>
                <p>📍 {restaurant.distance} miles away</p>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls (12 Per Page) */}
        {restaurants.length > itemsPerPage && (
          <div className="pagination">
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage * itemsPerPage >= restaurants.length}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurants;