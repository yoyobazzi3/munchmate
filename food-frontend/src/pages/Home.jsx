import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCommentDots, FaMapMarkerAlt, FaSearch, FaRegHeart, FaRegClock, FaSlidersH, FaMagic, FaLock } from "react-icons/fa";
import { getUser } from "../utils/tokenService";
import api from "../utils/axiosInstance";
import { getUserLocation } from "../utils/getLocation";
import { CUISINE_TO_YELP, SYMBOL_TO_NUM, PRICE_LABELS } from "../utils/constants";
import RestaurantDetailsModal from "../components/RestaurantDetailsModal";
import Navbar from "../components/Navbar";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [location, setLocation] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [showFloatingAi, setShowFloatingAi] = useState(true);
  const [popularRestaurants, setPopularRestaurants] = useState([]);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const aiPromoRef = useRef(null);

  useEffect(() => {
    // Single fetch populates both "Popular Near You" and "Recommended For You"
    // to avoid making two separate API calls to /getRestaurants on every load
    const fetchHomeRestaurants = async () => {
      try {
        const coords = await getUserLocation();

        // Fetch a general nearby list — this powers the "Top Picks" section
        const res = await api.get("/getRestaurants", {
          params: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            radius: 8000,
          },
        });
        const allRestaurants = res.data;
        setPopularRestaurants(allRestaurants.slice(0, 4));

        // If logged in, also load preferences and filter for "Recommended For You"
        if (user) {
          const prefRes = await api.get("/preferences");
          const prefs = prefRes.data;
          const priceNum = SYMBOL_TO_NUM[prefs.preferredPriceRange] || "";
          const cuisineList = (prefs.favoriteCuisines || [])
            .map(c => CUISINE_TO_YELP[c])
            .filter(Boolean);

          // Filter the already-fetched list by the user's preferred cuisines/price
          const recommended = allRestaurants.filter(r => {
            const matchesCuisine = cuisineList.length === 0 ||
              r.categories?.some(cat => cuisineList.includes(cat.alias));
            const matchesPrice = !priceNum || r.price === PRICE_LABELS[parseInt(priceNum) - 1];
            return matchesCuisine || matchesPrice;
          });

          setRecommendedRestaurants(recommended.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load home restaurants", err);
      }
    };
    fetchHomeRestaurants();
  }, []);



  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingAi(!entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (aiPromoRef.current) observer.observe(aiPromoRef.current);
    
    return () => {
      if (aiPromoRef.current) observer.unobserve(aiPromoRef.current);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Pass both the user-typed location and the selected cuisine
    navigate("/restaurants", { state: { location, cuisine } });
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
            <button className="ai-banner-btn" onClick={() => navigate("/chatbot")}>
              <FaCommentDots className="btn-icon" /> Chat with MunchMate AI
            </button>
          ) : (
            <button className="ai-banner-btn ai-banner-btn--locked" onClick={() => navigate("/auth?mode=login")}>
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
            <button className="browse-all-btn" onClick={() => navigate("/restaurants")}>
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
            <button className="locked-signin-btn" onClick={() => navigate("/auth?mode=login")}>
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
      <div className={`floating-ai-btn ${showFloatingAi ? 'visible' : 'hidden'}`} onClick={() => navigate(user ? "/chatbot" : "/auth?mode=login")}>
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
