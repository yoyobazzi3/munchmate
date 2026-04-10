/* -------------------------------------------------------------
   Restaurants.jsx  –  works with either text location or lat/lon
   ------------------------------------------------------------- */
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { getUserLocation } from "../utils/getLocation";
import Filter from "../components/Filter";
import SearchBar from "../components/SearchBar";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import { FaChevronLeft, FaChevronRight, FaUtensils } from "react-icons/fa";
import Navbar from "../components/Navbar";
import "./Restaurants.css";

// ── Module-level constants (never recreated on render) ───────────────────────
const SYMBOL_TO_NUM = { "$": "1", "$$": "2", "$$$": "3", "$$$$": "4" };
const CUISINE_TO_YELP = {
  Italian: "italian", Japanese: "japanese", Mexican: "mexican",
  Indian: "indpak", Chinese: "chinese", Pizza: "pizza",
  Burgers: "burgers", Sushi: "sushi",
};

// ── Extracted + memoized sub-components ─────────────────────────────────────
const RestaurantCard = memo(({ restaurant, onClick }) => (
  <div className="restaurant-card" onClick={() => onClick(restaurant.id)}>
    <img
      src={restaurant.image_url || "https://via.placeholder.com/200"}
      alt={restaurant.name}
      className="restaurant-image"
      loading="lazy"
    />
    <h3>{restaurant.name}</h3>
    <p>⭐ {restaurant.rating} ({restaurant.review_count})</p>
    <p>{restaurant.price || "N/A"}</p>
    <p>{restaurant.location?.address1}</p>
  </div>
));

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
    <p>We couldn't find any restaurants matching your criteria.</p>
    <p>Try adjusting your filters or search terms.</p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="error-container">
    <div className="error-icon">⚠️</div>
    <h3>Oops! Something went wrong</h3>
    <p>{message}</p>
    <button className="retry-button" onClick={onRetry}>Try Again</button>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const Restaurants = () => {
  const locationData = useLocation();
  const navState     = locationData.state || {};

  const userTypedLocation   = navState.location || "";
  const userSelectedCuisine = navState.cuisine  || "";

  /* ------------------ search filters ------------------ */
  const [filters, setFilters] = useState({
    latitude : null,
    longitude: null,
    location : userTypedLocation,
    category : userSelectedCuisine,
    price    : "",
    radius   : 5000,
    sortBy   : "best_match",
    minRating: "",
    term     : ""
  });

  // Pending search term — committed to filters after 400ms debounce
  const [pendingTerm, setPendingTerm] = useState("");

  /* ------------------- UI state ----------------------- */
  const [restaurants,            setRestaurants           ] = useState([]);
  const [recentlyViewed,         setRecentlyViewed        ] = useState([]);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  const [currentPage,            setCurrentPage           ] = useState(1);
  const resultsPerPage = 12;

  const [loading,     setLoading    ] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error,       setError      ] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [filterDefaults, setFilterDefaults] = useState({ price: "", category: "" });

  /* ----------- load preferences and apply as filter defaults ---------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        const priceNum = SYMBOL_TO_NUM[data.preferredPriceRange] || "";
        const cuisineList = (data.favoriteCuisines || [])
          .map(c => CUISINE_TO_YELP[c])
          .filter(Boolean)
          .join(",");
        setFilterDefaults({ price: priceNum, category: cuisineList });
        setFilters(f => ({ ...f, price: priceNum, category: cuisineList }));
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true));
  }, []);

  /* ----------- set coords IF no text location ---------- */
  useEffect(() => {
    if (userTypedLocation) {
      setFilters(f => ({ ...f, location: userTypedLocation, latitude: null, longitude: null }));
    } else {
      getUserLocation()
        .then(coords =>
          setFilters(f => ({ ...f, latitude: coords.latitude, longitude: coords.longitude, location: "" }))
        )
        .catch(() =>
          setError("Unable to get your location. Please enter it manually or try again.")
        );
    }
  }, [userTypedLocation]);

  /* --- auto-scroll to filters pane when coming from Home --- */
  useEffect(() => {
    if (navState.openFilters) {
      document.querySelector(".filter-sidebar")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [navState]);

  /* ----------- debounce search term — 400ms ----------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(f => ({ ...f, term: pendingTerm }));
    }, 400);
    return () => clearTimeout(timer);
  }, [pendingTerm]);

  /* ------------------ fetch restaurants ---------------------- */
  const fetchRestaurants = useCallback(async () => {
    if (!prefsLoaded) return;
    if (
      (!filters.location || filters.location.trim() === "") &&
      (!filters.latitude || !filters.longitude)
    ) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res   = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/getRestaurants`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, params: filters }
      );

      let data = res.data;
      if (filters.minRating) data = data.filter(r => r.rating >= parseFloat(filters.minRating));

      setCurrentPage(1);
      setRestaurants(data);
      setInitialLoad(false);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError("Failed to load restaurants. Please try again.");
      setInitialLoad(false);
    }
    setLoading(false);
  }, [filters, prefsLoaded]);

  /* -------------- recently viewed — mount only --------------------- */
  const fetchRecentlyViewed = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const user  = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) return;

      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/clickHistory/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.length) setRecentlyViewed(res.data);
    } catch (err) { console.error("Error fetching click history:", err); }
  }, []);

  /* ------------- lifecycle wiring -------------------- */
  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRecentlyViewed(); }, []); // mount only

  /* ------------ recommendations ----------------------- */
  useEffect(() => {
    if (!recentlyViewed.length || !restaurants.length) return;

    const viewedIds = new Set(recentlyViewed.map(r => r.id));
    const recentAliases = new Set(
      recentlyViewed.flatMap(r => r.categories?.map(c => c.alias) || [])
    );

    const recs = restaurants
      .filter(r =>
        !viewedIds.has(r.id) &&
        r.categories?.some(c => recentAliases.has(c.alias))
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    setRecommendedRestaurants(recs);
  }, [recentlyViewed, restaurants]);

  /* ------------------- handlers ---------------------- */
  const handleApplyFilters = useCallback(newFilters =>
    setFilters(f => ({ ...f, ...newFilters })), []);

  const handleSearch = useCallback(searchValue => {
    const term = typeof searchValue === "object" ? searchValue.text ?? "" : searchValue;
    setPendingTerm(term);
  }, []);

  /* click-tracker for "recently viewed" */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!selectedRestaurantId || !user?.id) return;

    (async () => {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/trackClick`,
          { restaurant_id: selectedRestaurantId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchRecentlyViewed();
      } catch (err) { console.error("Tracking click failed:", err); }
    })();
  }, [selectedRestaurantId, fetchRecentlyViewed]);

  /* -------------- memoized pagination helpers ----------------- */
  const totalResults = restaurants.length;
  const totalPages   = useMemo(() => Math.ceil(totalResults / resultsPerPage), [totalResults]);

  const currentPageRestaurants = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return restaurants.slice(start, start + resultsPerPage);
  }, [restaurants, currentPage]);

  const paginationNumbers = useMemo(() => {
    const pages = [];
    const max   = 5;
    let start   = Math.max(1, currentPage - 2);
    let end     = Math.min(totalPages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }, [currentPage, totalPages]);

  /* -------------------- render ----------------------- */
  return (
    <div className="restaurants-page">
    <Navbar variant="inner" title="Restaurants" backPath="/home" />

      {/* ─── Two-column layout ─── */}
      <div className="restaurants-container">
        <aside className="filter-sidebar">
          <Filter key={prefsLoaded ? "loaded" : "loading"} defaultValues={filterDefaults} onApply={handleApplyFilters} />
        </aside>

        <section className="restaurant-results">
          <SearchBar
            onSearch={handleSearch}
            userLocation={{ latitude: filters.latitude, longitude: filters.longitude }}
          />

          {/* Recommended */}
          {recommendedRestaurants.length > 0 && (
            <div className="restaurant-section">
              <h2>Recommended For You</h2>
              <div className="restaurant-row">
                {recommendedRestaurants.map(r => (
                  <RestaurantCard key={`rec-${r.id}`} restaurant={r} onClick={setSelectedRestaurantId} />
                ))}
              </div>
            </div>
          )}

          {/* Recently viewed */}
          {recentlyViewed.length > 0 && (
            <div className="restaurant-section">
              <h2>Recently Viewed</h2>
              <div className="restaurant-row">
                {recentlyViewed.slice(0, 5).map(r => (
                  <RestaurantCard key={`recent-${r.id}`} restaurant={r} onClick={setSelectedRestaurantId} />
                ))}
              </div>
            </div>
          )}

          {/* Main results */}
          <div className="restaurant-section">
            <h2>Nearby Restaurants</h2>

            {initialLoad && loading && <LoadingState />}
            {error && <ErrorState message={error} onRetry={fetchRestaurants} />}
            {!initialLoad && !loading && !error && (
              restaurants.length === 0
                ? <EmptyResultsState />
                : <>
                    {/* summary */}
                    <div className="results-summary">
                      Showing {Math.min((currentPage - 1) * resultsPerPage + 1, totalResults)} -{" "}
                      {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults} restaurants
                    </div>

                    {/* grid */}
                    <div className="restaurant-grid">
                      {currentPageRestaurants.map(r => (
                        <RestaurantCard key={r.id} restaurant={r} onClick={setSelectedRestaurantId} />
                      ))}
                    </div>

                    {/* pagination */}
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button className="pagination-arrow"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}>
                          <FaChevronLeft />
                        </button>
                        {paginationNumbers.map(p => (
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
            )}
          </div>
        </section>
      </div>

      {/* Details modal */}
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
