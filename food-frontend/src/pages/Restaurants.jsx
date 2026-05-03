/* -------------------------------------------------------------
   Restaurants.jsx  –  works with either text location or lat/lon
   ------------------------------------------------------------- */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import useGeolocation from "../hooks/useGeolocation";
import { usePreferences } from "../hooks/usePreferences";
import useRestaurantSearch from "../hooks/useRestaurantSearch";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import useFavorites from "../hooks/useFavorites";
import usePagination from "../hooks/usePagination";
import Filter from "../components/Filter";
import SearchBar from "../components/SearchBar";
import RestaurantCard from "../components/RestaurantCard";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import { LoadingState, EmptyResultsState, ErrorState, NoLocationState } from "../components/RestaurantStates";
import { FaChevronLeft, FaChevronRight, FaFilter } from "react-icons/fa";
import Navbar from "../components/Navbar";
import { ITEMS_PER_PAGE } from "../utils/constants";
import { mapPreferencesToFilters } from "../utils/preferenceMappers";
import "./Restaurants.css";

const RestaurantRowSection = ({ title, restaurants, onSelect, keyPrefix, isFavorited, onToggleFavorite }) => {
  if (!restaurants || restaurants.length === 0) return null;
  return (
    <div className="restaurant-section">
      <h2>{title}</h2>
      <div className="restaurant-row">
        {restaurants.map(r => (
          <RestaurantCard
            key={`${keyPrefix}-${r.id}`}
            restaurant={r}
            onClick={onSelect}
            isFavorited={isFavorited?.(r.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Main Restaurants feed view allowing deep filtering, geolocation-based fetching, 
 * pagination, and displaying intelligent recommendations.
 *
 * @component
 * @returns {JSX.Element} The rendered Restaurants application page.
 */
const Restaurants = () => {
  const locationData = useLocation();
  const navState     = useMemo(() => locationData.state || {}, [locationData.state]);

  const userTypedLocation   = navState.location  || "";
  const userSelectedCuisine = navState.cuisine   || "";
  const navLatitude         = navState.latitude  || null;
  const navLongitude        = navState.longitude || null;

  /* ------------------ search filters ------------------ */
  const [filters, setFilters] = useState({
    latitude : navLatitude,
    longitude: navLongitude,
    location : userTypedLocation,
    category : userSelectedCuisine,
    price    : "",
    radius   : 5000,
    sortBy   : "best_match",
    minRating: "",
    term     : ""
  });

  const [pendingTerm,          setPendingTerm         ] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [filterOpen,           setFilterOpen          ] = useState(false);

  /* ── Hooks ── */
  // Skip geolocation if coords were passed via navigation state (e.g. from Home page)
  const geoEnabled = !userTypedLocation && !navLatitude;
  const { latitude, longitude, locationError, locationLoading, requestLocation } = useGeolocation({ enabled: geoEnabled });
  const { preferences, loading: prefsLoading } = usePreferences();
  const prefsLoaded = !prefsLoading;

  // Computed in the same render as `preferences` — no separate state update cycle.
  const filterDefaults = useMemo(
    () => preferences ? mapPreferencesToFilters(preferences) : { price: "", category: "" },
    [preferences]
  );

  const { restaurants, loading, initialLoad, error, fetchRestaurants } =
    useRestaurantSearch(filters, prefsLoaded);
  const { recentlyViewed } = useRecentlyViewed(selectedRestaurantId);
  const { favorites, isFavorited, toggleFavorite, saveFavoriteUpdate } = useFavorites();

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    currentItems: currentPageRestaurants,
    paginationNumbers,
  } = usePagination(restaurants, ITEMS_PER_PAGE);

  /* ----------- apply coords/location to filters ---------- */
  useEffect(() => {
    if (userTypedLocation) {
      setFilters(f => ({ ...f, location: userTypedLocation, latitude: null, longitude: null }));
    } else if (navLatitude && navLongitude) {
      setFilters(f => ({ ...f, latitude: navLatitude, longitude: navLongitude, location: "" }));
    } else if (latitude && longitude) {
      setFilters(f => ({ ...f, latitude, longitude, location: "" }));
    }
  }, [userTypedLocation, navLatitude, navLongitude, latitude, longitude]);

  /* ----------- apply prefs as filter defaults ---------- */
  useEffect(() => {
    if (!preferences) return;
    setFilters(f => ({ ...f, ...mapPreferencesToFilters(preferences) }));
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

  /* ------------------- handlers ---------------------- */
  /**
   * Merges incoming filter tweaks with the existing filter state.
   * 
   * @param {Object} newFilters - Subset of filter properties to overwrite.
   */
  const handleApplyFilters = useCallback(
    (newFilters) => {
      setFilters(f => ({ ...f, ...newFilters }));
      setFilterOpen(false);
    },
    []
  );

  /**
   * Binds text-based search values into pending state to allow debounce cycles.
   * 
   * @param {string|Object} searchValue - The raw text or event encapsulating the search term.
   */
  const handleSearch = useCallback((searchValue) => {
    const term = typeof searchValue === "object" ? searchValue.text ?? "" : searchValue;
    setPendingTerm(term);
  }, []);

  const displayError  = locationError || error;
  const totalResults  = restaurants.length;
  const noLocation    = !locationLoading && !navLatitude && !filters.latitude && !filters.longitude && !filters.location;

  /* -------------------- render ----------------------- */
  return (
    <div className="restaurants-page">
      <Navbar variant="inner" title="Restaurants" backPath="/home" />

      {/* ─── Filter drawer ─── */}
      {filterOpen && (
        <div className="filter-overlay" onClick={() => setFilterOpen(false)}>
          <div className="filter-drawer" onClick={e => e.stopPropagation()}>
            <button className="filter-drawer__close" onClick={() => setFilterOpen(false)}>✕</button>
            <Filter
              key={preferences ? "loaded" : "loading"}
              defaultValues={filterDefaults}
              onApply={handleApplyFilters}
            />
          </div>
        </div>
      )}

      {/* ─── Main content ─── */}
      <div className="restaurants-container">
        <aside className="filter-sidebar">
          <Filter
            key={preferences ? "loaded" : "loading"}
            defaultValues={filterDefaults}
            onApply={handleApplyFilters}
          />
        </aside>

        <section className="restaurant-results">
          <div className="restaurant-results__topbar">
            <SearchBar
              onSearch={handleSearch}
              userLocation={{ latitude: filters.latitude, longitude: filters.longitude }}
            />
            <button className="filter-fab" onClick={() => setFilterOpen(true)}>
              <FaFilter /> Filters
            </button>
          </div>

          <RestaurantRowSection
            title="Recently Viewed"
            restaurants={recentlyViewed.slice(0, 5)}
            onSelect={setSelectedRestaurantId}
            keyPrefix="recent"
            isFavorited={isFavorited}
            onToggleFavorite={toggleFavorite}
          />

          {/* Main results */}
          <div className="restaurant-section">
            <h2>Nearby Restaurants</h2>

            {locationLoading && (
              <div className="loading-container">
                <div className="loading-animation"><span>📍</span></div>
                <p className="loading-text">Detecting your location...</p>
              </div>
            )}
            {!locationLoading && noLocation && <NoLocationState onRequestLocation={requestLocation} />}
            {!locationLoading && !noLocation && (loading || initialLoad) && <LoadingState />}
            {!locationLoading && !noLocation && !loading && !initialLoad && displayError && <ErrorState message={displayError} onRetry={fetchRestaurants} />}
            {!locationLoading && !noLocation && !loading && !initialLoad && !displayError && (
              restaurants.length === 0
                ? <EmptyResultsState />
                : <>
                    <div className="results-summary">
                      Showing{" "}
                      {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalResults)} –{" "}
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalResults)} of {totalResults} restaurants
                    </div>

                    <div className="restaurant-grid">
                      {currentPageRestaurants.map(r => (
                        <RestaurantCard
                          key={r.id}
                          restaurant={r}
                          onClick={setSelectedRestaurantId}
                          isFavorited={isFavorited(r.id)}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          className="pagination-arrow"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <FaChevronLeft />
                        </button>
                        {paginationNumbers.map(p => (
                          <button
                            key={p}
                            className={`pagination-number ${p === currentPage ? "active" : ""}`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          className="pagination-arrow"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
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
      {selectedRestaurantId && (() => {
        const fav = favorites.find(r => r.id === selectedRestaurantId);
        return (
          <RestaurantDetailsModal
            id={selectedRestaurantId}
            onClose={() => setSelectedRestaurantId(null)}
            isFavorited={isFavorited(selectedRestaurantId)}
            onToggleFavorite={toggleFavorite}
            favoriteNote={fav?.note}
            favoriteStatus={fav?.status}
            onSaveFavoriteUpdate={saveFavoriteUpdate}
          />
        );
      })()}
    </div>
  );
};

export default Restaurants;
