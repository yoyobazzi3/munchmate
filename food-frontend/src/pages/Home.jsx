import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCommentDots, FaMapMarkerAlt, FaSearch, FaRegHeart, FaRegClock, FaSlidersH, FaMagic, FaLock } from "react-icons/fa";
import { getRestaurants } from "../services/restaurantService";
import { CUISINE_TO_YELP, SYMBOL_TO_NUM, PRICE_LABELS } from "../utils/constants";
import useGeolocation from "../hooks/useGeolocation";
import { useUser } from "../context/UserContext";
import { usePreferences } from "../context/PreferencesContext";
import { ROUTES, AUTH_ROUTES } from "../utils/routes";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import Navbar from "../components/Navbar";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [location, setLocation] = useState("");
  const [cuisine] = useState("");
  const [showFloatingAi, setShowFloatingAi] = useState(true);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [popularRestaurants, setPopularRestaurants] = useState([]);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const aiPromoRef = useRef(null);

  const { latitude, longitude } = useGeolocation();
  const { preferences } = usePreferences();

  // Fetch nearby restaurants once coords are available
  useEffect(() => {
    if (!latitude || !longitude) return;

    getRestaurants({ latitude, longitude, radius: 8000 })
      .then((data) => {
        setAllRestaurants(data);
        setPopularRestaurants(data.slice(0, 4));
      })
      .catch((err) => console.error("Failed to load home restaurants", err));
  }, [latitude, longitude]);

  // Compute recommendations once restaurants + preferences are both ready
  useEffect(() => {
    if (!user || !preferences || !allRestaurants.length) return;

    const priceNum = SYMBOL_TO_NUM[preferences.preferredPriceRange] || "";
    const cuisineList = (preferences.favoriteCuisines || [])
      .map((c) => CUISINE_TO_YELP[c])
      .filter(Boolean);

    const recommended = allRestaurants.filter((r) => {
      const matchesCuisine =
        cuisineList.length === 0 ||
        r.categories?.some((cat) => cuisineList.includes(cat.alias));
      const matchesPrice = !priceNum || r.price === PRICE_LABELS[parseInt(priceNum) - 1];
      return matchesCuisine || matchesPrice;
    });

    setRecommendedRestaurants(recommended.slice(0, 4));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRestaurants, preferences]); // user is stable for the component's lifetime



  useEffect(() => {
    const node = aiPromoRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingAi(!entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (node) observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Pass both the user-typed location and the selected cuisine
    navigate(ROUTES.RESTAURANTS, { state: { location, cuisine } });
  };

  return (
    <div className="home-page">
      <Navbar
        variant="app"
        navLinks={[
          { label: "Home", href: "#home" },
          { label: "How It Works", href: "#how-it-works" },
        ]}
      />

      {/* Main Content */}
      <div id="home" className="hero-section">
        <div className="hero-content">
          <div className="ai-badge">
            <span className="sparkle">✨</span> AI-Powered Recommendations
          </div>
          <h1 className="main-title">Discover Delicious<br/>Food Near You</h1>
          <p className="subtext">
            Find the perfect restaurant based on your location, preferences, and cravings. Let our AI guide you to your next favorite meal.
          </p>

          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-inputs">
                {/* Location Input */}
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
        <div className="ai-banner-icon">
          <FaCommentDots />
        </div>
        <h2>Not Sure What You're Craving?</h2>
        <p>Let our AI-powered food assistant help you decide. Tell us your mood,<br/>and we'll find the perfect match.</p>
        <div className="ai-banner-actions">
          {user ? (
            <button className="ai-banner-btn" onClick={() => navigate(ROUTES.CHATBOT)}>
              <FaCommentDots className="btn-icon" /> Chat with MunchMate AI
            </button>
          ) : (
            <button className="ai-banner-btn ai-banner-btn--locked" onClick={() => navigate(AUTH_ROUTES.LOGIN)}>
              <FaLock className="btn-icon" /> Sign in to use MunchMate AI
            </button>
          )}
        </div>
      </div>

      {/* Popular Near You Section */}
      <div className="popular-near-you-section">
        <span className="top-picks-badge">🔥 Top Picks</span>
        <h2>Popular Near You</h2>
        <p className="popular-subtitle">These restaurants are getting rave reviews from food lovers in your area</p>
        
        <div className="popular-cards-grid">
          {popularRestaurants.map((r) => (
            <div key={r.id} className="popular-card" onClick={() => setSelectedRestaurantId(r.id)}>
              <div className="popular-card-image" style={{ backgroundImage: `url(${r.image_url})` }}>
                <div className="card-badge">Trending</div>
                <div className="card-heart">
                  <FaRegHeart />
                </div>
              </div>
              <div className="popular-card-content">
                <div className="popular-card-header">
                  <h3>{r.name}</h3>
                  <span className="price">{r.price || "$$"}</span>
                </div>
                <p className="category">{r.categories?.[0]?.title || "Restaurant"}</p>
                <div className="rating">
                  <span className="star">⭐</span> {r.rating} <span className="review-count">({r.review_count})</span>
                </div>
                <div className="card-meta">
                  <span><FaMapMarkerAlt /> {r.distance ? (r.distance * 0.000621371).toFixed(1) : "1.2"} mi</span>
                  <span><FaRegClock /> 15-20 min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended For You Section */}
      <div className="recommended-section">
        <div className="recommended-header">
          <div>
            <span className="recommended-badge">✨ Personalized</span>
            <h2>Recommended For You</h2>
            <p className="recommended-subtitle">Hand-picked based on your taste preferences</p>
          </div>
          {user && (
            <button className="browse-all-btn" onClick={() => navigate(ROUTES.RESTAURANTS)}>
              Browse all →
            </button>
          )}
        </div>
        {user ? (
          recommendedRestaurants.length > 0 && (
            <div className="recommended-cards-grid">
              {recommendedRestaurants.map((r) => (
                <div
                  key={r.id}
                  className="recommended-card"
                  onClick={() => setSelectedRestaurantId(r.id)}
                  style={{ backgroundImage: `url(${r.image_url})` }}
                >
                  <div className="recommended-card-overlay">
                    <span className="rec-count">{r.review_count} reviews</span>
                    <h3>{r.name}</h3>
                    <p>{r.categories?.[0]?.title || "Restaurant"}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="recommended-locked">
            <FaLock className="locked-icon" />
            <h3 className="locked-title">Your Personalized Picks Await</h3>
            <p>Sign in to unlock AI-powered restaurant recommendations<br/>tailored to your taste preferences and location. 🍽️</p>
            <button className="locked-signin-btn" onClick={() => navigate(AUTH_ROUTES.LOGIN)}>
              Sign In for Recommendations
            </button>
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="how-it-works-v2">
        <div className="hiw-header">
          <h2>How It Works</h2>
          <p>Finding your next favorite restaurant is as easy as 1-2-3</p>
        </div>
        <div className="hiw-steps">
          <div className="hiw-step">
            <div className="hiw-step-icon-wrapper">
              <span className="hiw-step-num">01</span>
              <div className="hiw-icon-box">
                <FaMapMarkerAlt />
              </div>
            </div>
            <h3>Share Your Location</h3>
            <p>Enable location services or enter your address to find the best restaurants nearby.</p>
          </div>

          <div className="hiw-connector" />

          <div className="hiw-step">
            <div className="hiw-step-icon-wrapper">
              <span className="hiw-step-num">02</span>
              <div className="hiw-icon-box">
                <FaSlidersH />
              </div>
            </div>
            <h3>Set Your Preferences</h3>
            <p>Filter by cuisine, price range, dietary restrictions, and more to match your taste.</p>
          </div>

          <div className="hiw-connector" />

          <div className="hiw-step">
            <div className="hiw-step-icon-wrapper">
              <span className="hiw-step-num">03</span>
              <div className="hiw-icon-box">
                <FaMagic />
              </div>
            </div>
            <h3>Discover &amp; Enjoy</h3>
            <p>Browse personalized AI recommendations and find your perfect meal in minutes.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>© 2025 MunchMate. All rights reserved.</p>
      </div>

      {/* Floating AI Button */}
      <div className={`floating-ai-btn ${showFloatingAi ? 'visible' : 'hidden'}`} onClick={() => navigate(user ? ROUTES.CHATBOT : AUTH_ROUTES.LOGIN)}>
        <FaCommentDots />
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

export default Home;
