/* -------------------------------------------------------------
   Restaurants.jsx  –  works with either text location or lat/lon
   ------------------------------------------------------------- */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import useGeolocation from "../hooks/useGeolocation";
import { usePreferences } from "../context/PreferencesContext";
import useRestaurantSearch from "../hooks/useRestaurantSearch";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import Filter from "../components/Filter";
import SearchBar from "../components/SearchBar";
import RestaurantCard from "../components/RestaurantCard";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import { LoadingState, EmptyResultsState, ErrorState } from "../components/RestaurantStates";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Navbar from "../components/Navbar";
import { CUISINE_TO_YELP, SYMBOL_TO_NUM } from "../utils/constants";
import "./Restaurants.css";

// ── Main component ───────────────────────────────────────────────────────────
const Restaurants = () => {
  const locationData = useLocation();
  const navState     = useMemo(() => locationData.state || {}, [locationData.state]);

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
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  const [currentPage,            setCurrentPage           ] = useState(1);
  const resultsPerPage = 12;

  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [filterDefaults, setFilterDefaults] = useState({ price: "", category: "" });

  /* ── Hooks ── */
  const { latitude, longitude, locationError } = useGeolocation({ enabled: !userTypedLocation });
  const { preferences, loading: prefsLoading } = usePreferences();
  const prefsLoaded = !prefsLoading;

  const { restaurants, loading, initialLoad, error, fetchRestaurants } =
    useRestaurantSearch(filters, prefsLoaded);
  const { recentlyViewed } = useRecentlyViewed(selectedRestaurantId);

  /* ----------- apply geolocation coords to filters ---------- */
  useEffect(() => {
    if (userTypedLocation) {
      setFilters(f => ({ ...f, location: userTypedLocation, latitude: null, longitude: null }));
    } else if (latitude && longitude) {
      setFilters(f => ({ ...f, latitude, longitude, location: "" }));
    }
  }, [userTypedLocation, latitude, longitude]);

  /* ----------- apply prefs as filter defaults ---------- */
  useEffect(() => {
    if (!preferences) return;
    const priceNum = SYMBOL_TO_NUM[preferences.preferredPriceRange] || "";
    const cuisineList = (preferences.favoriteCuisines || [])
      .map(c => CUISINE_TO_YELP[c])
      .filter(Boolean)
      .join(",");
    setFilterDefaults({ price: priceNum, category: cuisineList });
    setFilters(f => ({ ...f, price: priceNum, category: cuisineList }));
  }, [preferences]);

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

  /* reset to page 1 whenever a new result set arrives */
  useEffect(() => { setCurrentPage(1); }, [restaurants]);

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

  const displayError = locationError || error;

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
            {displayError && <ErrorState message={displayError} onRetry={fetchRestaurants} />}
            {!initialLoad && !loading && !displayError && (
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
