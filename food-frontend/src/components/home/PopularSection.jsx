import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaRegClock } from "react-icons/fa";

const PopularSection = ({ restaurants, onSelectRestaurant, isFavorited, onToggleFavorite, hasLocation, locationLoading, onRequestLocation }) => (
  <div id="top-picks" className="popular-near-you-section">
    <span className="top-picks-badge">🔥 Top Picks</span>
    <h2>Popular Near You</h2>
    <p className="popular-subtitle">
      These restaurants are getting rave reviews from food lovers in your area
    </p>

    {!hasLocation && !locationLoading ? (
      <div className="empty-results-container">
        <div className="empty-icon">📍</div>
        <h3>We need your location</h3>
        <p>Please allow location access so we can show popular restaurants near you.</p>
        {onRequestLocation && (
          <button className="retry-button" onClick={onRequestLocation}>Share My Location</button>
        )}
      </div>
    ) : (
    <div className="popular-cards-grid">
      {restaurants.map((r) => (
        <div key={r.id} className="popular-card" onClick={() => onSelectRestaurant(r.id)}>
          <div className="popular-card-image" style={{ backgroundImage: `url(${r.image_url})` }}>
            <div className="card-badge">Trending</div>
            {onToggleFavorite && (
              <div
                className={`card-heart ${isFavorited?.(r.id) ? "card-heart--active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(r.id);
                }}
              >
                {isFavorited?.(r.id) ? <FaHeart color="#ff4d6d" /> : <FaRegHeart />}
              </div>
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
