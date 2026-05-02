import { FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ROUTES, AUTH_ROUTES } from "../../utils/routes";

const RecommendedSection = ({ user, restaurants, onSelectRestaurant, latitude, longitude }) => {
  const navigate = useNavigate();

  return (
    <div id="recommended" className="recommended-section">
      <div className="recommended-header">
        <div>
          <span className="recommended-badge">✨ Personalized</span>
          <h2>Recommended For You</h2>
          <p className="recommended-subtitle">Hand-picked based on your taste preferences</p>
        </div>
        {user && (
          <button className="browse-all-btn" onClick={() => navigate(ROUTES.RESTAURANTS, { state: { latitude, longitude } })}>
            Browse all →
          </button>
        )}
      </div>

      {user ? (
        restaurants.length > 0 && (
          <div className="recommended-cards-grid">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className="recommended-card"
                onClick={() => onSelectRestaurant(r.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelectRestaurant(r.id)}
                style={{ backgroundImage: `url(${r.image_url})` }}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${r.name}`}
              >
                <div className="recommended-card-overlay">
                  {r._reason && (
                    <span className="rec-reason">Because you like {r._reason}</span>
                  )}
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
          <p>
            Sign in to unlock AI-powered restaurant recommendations
            <br />tailored to your taste preferences and location. 🍽️
          </p>
          <button
            className="locked-signin-btn"
            onClick={() => navigate(AUTH_ROUTES.LOGIN)}
          >
            Sign In for Recommendations
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendedSection;
