import { FaRegHeart, FaMapMarkerAlt, FaRegClock } from "react-icons/fa";

const PopularSection = ({ restaurants, onSelectRestaurant }) => (
  <div className="popular-near-you-section">
    <span className="top-picks-badge">🔥 Top Picks</span>
    <h2>Popular Near You</h2>
    <p className="popular-subtitle">
      These restaurants are getting rave reviews from food lovers in your area
    </p>

    <div className="popular-cards-grid">
      {restaurants.map((r) => (
        <div key={r.id} className="popular-card" onClick={() => onSelectRestaurant(r.id)}>
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
  </div>
);

export default PopularSection;
