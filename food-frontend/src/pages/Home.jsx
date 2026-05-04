import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCommentDots, FaMapMarkerAlt, FaSearch, FaLock } from "react-icons/fa";
import { getRestaurants } from "../services/restaurantService";
import { POPULAR_RESTAURANTS_COUNT, RECOMMENDED_RESTAURANTS_COUNT, DEFAULT_SEARCH_RADIUS_HOME } from "../utils/constants";
import useGeolocation from "../hooks/useGeolocation";
import useIntersectionObserver from "../hooks/useIntersectionObserver";
import { mapPreferencesToFilters } from "../utils/preferenceMappers";
import { useUser } from "../hooks/useUser";
import { usePreferences } from "../hooks/usePreferences";
import { ROUTES, AUTH_ROUTES } from "../utils/routes";
import useFavorites from "../hooks/useFavorites";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import PopularSection from "../components/home/PopularSection";
import RecommendedSection from "../components/home/RecommendedSection";
import HowItWorks from "../components/home/HowItWorks";
import Navbar from "../components/Navbar";
import "./Home.css";

/**
 * Landing and unified Home page view displaying personalized restaurant recommendations,
 * AI promotional banners, and quick search capabilities.
 *
 * @component
 * @returns {JSX.Element} The fully composed Home application page.
 */
const Home = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [location, setLocation] = useState("");
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  const { latitude, longitude, locationLoading, permissionDenied, requestLocation } = useGeolocation();
  const { preferences } = usePreferences();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);

  const [aiPromoRef, isAiPromoVisible] = useIntersectionObserver({ threshold: 0.2 });

  const popularRestaurants = allRestaurants.slice(0, POPULAR_RESTAURANTS_COUNT);

  useEffect(() => {
    if (!latitude || !longitude) return;
    setRestaurantsLoading(true);
    setRestaurantsError(null);
    getRestaurants({ latitude, longitude, radius: DEFAULT_SEARCH_RADIUS_HOME })
      .then((data) => { setAllRestaurants(data); })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 429) setRestaurantsError("rate_limited");
        else if (status >= 500) setRestaurantsError("server_error");
        else setRestaurantsError("generic");
      })
      .finally(() => setRestaurantsLoading(false));
  }, [latitude, longitude]);

  useEffect(() => {
    if (!latitude || !longitude || !preferences) return;
    const { price, category } = mapPreferencesToFilters(preferences);
    if (!price && !category) return;
    getRestaurants({
      latitude,
      longitude,
      radius: DEFAULT_SEARCH_RADIUS_HOME,
      ...(category && { category }),
      ...(price && { price }),
    })
      .then((data) => setRecommendedRestaurants(data.slice(0, RECOMMENDED_RESTAURANTS_COUNT)))
      .catch((err) => console.error("Failed to load recommended restaurants", err));
  }, [latitude, longitude, preferences]);

  /**
   * Dispatches the local search intent straight to the centralized Restaurants feed.
   *
   * @param {React.FormEvent} e - Submit event from the search form.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    navigate(ROUTES.RESTAURANTS, { state: { location, latitude, longitude } });
  };

  return (
    <div className="home-page">
      <Navbar variant="app" />

      {/* Hero */}
      <div id="home" className="hero-section">
        <div className="hero-content">
          <div className="ai-badge">
            <span className="sparkle">✨</span> AI-Powered Recommendations
          </div>
          <h1 className="main-title">Discover Delicious<br/>Food Near You</h1>
          <p className="subtext">
            Find the perfect restaurant based on your location, preferences, and cravings.
            Let our AI guide you to your next favorite meal.
          </p>

          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-inputs">
                <div className="input-group location-input-group">
                  <FaMapMarkerAlt className="input-icon red-icon" />
                  <input
                    type="text"
                    placeholder="Enter your location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <button type="submit" className="search-btn">
                  <FaSearch className="btn-search-icon" /> Find Food
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* AI Promotion Banner */}
      <div className="ai-promo-banner" ref={aiPromoRef}>
        <div className="ai-banner-icon"><FaCommentDots /></div>
        <h2>Not Sure What You're Craving?</h2>
        <p>
          Let our AI-powered food assistant help you decide. Tell us your mood,
          <br/>and we'll find the perfect match.
        </p>
        <div className="ai-banner-actions">
          {user ? (
            <button className="ai-banner-btn" onClick={() => navigate(ROUTES.CHATBOT)}>
              <FaCommentDots className="btn-icon" /> Chat with MunchMate AI
            </button>
          ) : (
            <button
              className="ai-banner-btn ai-banner-btn--locked"
              onClick={() => navigate(AUTH_ROUTES.LOGIN)}
            >
              <FaLock className="btn-icon" /> Sign in to use MunchMate AI
            </button>
          )}
        </div>
      </div>

      <PopularSection
        restaurants={popularRestaurants}
        isLoading={restaurantsLoading}
        onSelectRestaurant={setSelectedRestaurantId}
        isFavorited={isFavorited}
        onToggleFavorite={user ? toggleFavorite : null}
        hasLocation={!!(latitude && longitude)}
        locationLoading={locationLoading}
        permissionDenied={permissionDenied}
        restaurantsError={restaurantsError}
        onRetry={() => {
          setRestaurantsError(null);
          setAllRestaurants([]);
          setRestaurantsLoading(true);
          getRestaurants({ latitude, longitude, radius: DEFAULT_SEARCH_RADIUS_HOME })
            .then((data) => setAllRestaurants(data))
            .catch((err) => {
              const status = err.response?.status;
              if (status === 429) setRestaurantsError("rate_limited");
              else if (status >= 500) setRestaurantsError("server_error");
              else setRestaurantsError("generic");
            })
            .finally(() => setRestaurantsLoading(false));
        }}
        onRequestLocation={requestLocation}
      />

      <RecommendedSection
        user={user}
        restaurants={recommendedRestaurants}
        onSelectRestaurant={setSelectedRestaurantId}
        latitude={latitude}
        longitude={longitude}
        onRequestLocation={requestLocation}
      />

      <HowItWorks />

      <div className="footer">
        <p>© 2025 MunchMate. All rights reserved.</p>
      </div>

      <button
        className={`floating-ai-btn ${!isAiPromoVisible ? "visible" : "hidden"}`}
        onClick={() => navigate(user ? ROUTES.CHATBOT : AUTH_ROUTES.LOGIN)}
        aria-label="Chat with MunchMate AI"
      >
        <FaCommentDots />
      </button>

      {selectedRestaurantId && (
        <RestaurantDetailsModal
          id={selectedRestaurantId}
          onClose={() => setSelectedRestaurantId(null)}
          isFavorited={isFavorited(selectedRestaurantId)}
          onToggleFavorite={user ? toggleFavorite : null}
        />
      )}
    </div>
  );
};

export default Home;
