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

const PopularSection = ({ restaurants, isLoading, onSelectRestaurant, isFavorited, onToggleFavorite, hasLocation, locationLoading, permissionDenied, onRequestLocation }) => (
  <div id="top-picks" className="popular-near-you-section">
    <span className="top-picks-badge">🔥 Top Picks</span>
    <h2>Popular Near You</h2>
    <p className="popular-subtitle">
      These restaurants are getting rave reviews from food lovers in your area
    </p>

    {!hasLocation && !locationLoading ? (
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
    ) : isLoading ? (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="loading-spinner" />
      </div>
    ) : (
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
    )}
  </div>
);

export default PopularSection;
