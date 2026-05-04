import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaRegClock } from "react-icons/fa";

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const SettingsInstructions = () => isIOS() ? (
  <p className="location-settings-hint">
    To enable: <strong>Settings → Privacy &amp; Security → Location Services → Safari</strong> → set to <em>While Using</em>
  </p>
) : (
  <p className="location-settings-hint">
    To enable: tap the <strong>🔒 lock icon</strong> in your browser's address bar → <strong>Permissions → Location → Allow</strong>
  </p>
);

const ERROR_MESSAGES = {
  rate_limited: {
    icon: "⏳",
    title: "Too many requests",
    body: "We're getting a lot of traffic right now. Please wait a moment and try again.",
  },
  server_error: {
    icon: "🛠️",
    title: "Service temporarily unavailable",
    body: "Our restaurant service is having issues. Please try again in a minute.",
  },
  generic: {
    icon: "😕",
    title: "Couldn't load restaurants",
    body: "Something went wrong fetching restaurants near you. Check your connection and try again.",
  },
};

const PopularSection = ({
  restaurants,
  isLoading,
  onSelectRestaurant,
  isFavorited,
  onToggleFavorite,
  hasLocation,
  locationLoading,
  permissionDenied,
  locationName,
  restaurantsError,
  onRetry,
  onRequestLocation,
}) => {
  const renderBody = () => {
    // 1. Waiting for GPS
    if (locationLoading && !hasLocation) {
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div className="loading-spinner" />
        </div>
      );
    }

    // 2. No location — either blocked or never asked
    if (!hasLocation) {
      return (
        <div className="empty-results-container">
          <div className="empty-icon">📍</div>
          {permissionDenied ? (
            <>
              <h3>Location access blocked</h3>
              <p>You blocked location access for this site. Enable it in your device settings to see restaurants near you.</p>
              <SettingsInstructions />
            </>
          ) : (
            <>
              <h3>We need your location</h3>
              <p>Please allow location access so we can show popular restaurants near you.</p>
              {onRequestLocation && (
                <button className="retry-button" onClick={onRequestLocation}>Share My Location</button>
              )}
            </>
          )}
        </div>
      );
    }

    // 3. Fetching restaurants
    if (isLoading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div className="loading-spinner" />
        </div>
      );
    }

    // 4. API error
    if (restaurantsError) {
      const { icon, title, body } = ERROR_MESSAGES[restaurantsError] ?? ERROR_MESSAGES.generic;
      return (
        <div className="empty-results-container">
          <div className="empty-icon">{icon}</div>
          <h3>{title}</h3>
          <p>{body}</p>
          {onRetry && (
            <button className="retry-button" onClick={onRetry}>Try Again</button>
          )}
        </div>
      );
    }

    // 5. Location available but no results
    if (restaurants.length === 0) {
      return (
        <div className="empty-results-container">
          <div className="empty-icon">🍽️</div>
          <h3>No restaurants found nearby</h3>
          <p>We couldn't find any restaurants in your area. Try expanding your search radius.</p>
        </div>
      );
    }

    // 6. Results
    return (
      <div className="popular-cards-grid">
        {restaurants.map((r) => (
          <div key={r.id} className="popular-card" onClick={() => onSelectRestaurant(r.id)}>
            <div className="popular-card-image" style={{ backgroundImage: `url(${r.image_url})` }}>
              <div className="card-badge">Trending</div>
              {onToggleFavorite && (
                <button
                  className={`card-heart ${isFavorited?.(r.id) ? "card-heart--active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(r.id);
                  }}
                  aria-label={isFavorited?.(r.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorited?.(r.id) ? <FaHeart color="#ff4d6d" /> : <FaRegHeart />}
                </button>
              )}
            </div>
            <div className="popular-card-content">
              <div className="popular-card-header">
                <h3>{r.name}</h3>
                <span className="price">{r.price || "$$"}</span>
              </div>
              <p className="category">{r.categories?.[0]?.title || "Restaurant"}</p>
              <div className="rating">
                <span className="star">⭐</span> {r.rating}{" "}
                <span className="review-count">({r.review_count})</span>
              </div>
              <div className="card-meta">
                <span>
                  <FaMapMarkerAlt />{" "}
                  {r.distance ? (r.distance * 0.000621371).toFixed(1) : "1.2"} mi
                </span>
                <span><FaRegClock /> 15-20 min</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div id="top-picks" className="popular-near-you-section">
      <span className="top-picks-badge">🔥 Top Picks</span>
      <h2>{locationName ? `Popular in ${locationName}` : "Popular Near You"}</h2>
      <p className="popular-subtitle">
        {locationName
          ? `Trending restaurants in ${locationName}`
          : "These restaurants are getting rave reviews from food lovers in your area"}
      </p>
      {locationName && (
        <p className="location-default-notice">
          {permissionDenied ? (
            <>
              Location access blocked. <SettingsInstructions />
            </>
          ) : (
            <>
              Showing results for {locationName}.{" "}
              {onRequestLocation && (
                <button className="location-default-link" onClick={onRequestLocation}>
                  Use my location
                </button>
              )}
            </>
          )}
        </p>
      )}
      {renderBody()}
    </div>
  );
};

export default PopularSection;
