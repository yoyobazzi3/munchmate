import { useEffect, useState } from "react";
import { getRestaurantDetails } from "../services/restaurantService";
import { getSpendLogs } from "../services/favoritesService";
import { getErrorMessage } from "../utils/errorHandler";
import { FaTimes, FaMapMarkerAlt, FaPhone, FaStar, FaExternalLinkAlt, FaHeart, FaRegHeart } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Modal, Spinner, Chip, Button } from "./ui";
import PhotoGallery from "./PhotoGallery";
import HoursSection from "./HoursSection";
import "./RestaurantDetailsModal.css";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl      : "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl    : "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/**
 * Full-screen overlapping modal detailing exhaustive restaurant specifics
 * including embedded interactive routing maps, galleries, and operational times.
 *
 * @param {Object} props
 * @param {string} props.id - The Restaurant identifier used to orchestrate data fetches.
 * @param {function():void} props.onClose - State mutation hook hiding the overlay wrapper.
 * @returns {JSX.Element|null}
 */
const RestaurantDetailsModal = ({ id, onClose, isFavorited, onToggleFavorite, favoriteNote, favoriteStatus, favoriteRating, favoriteAmountSpent, onSaveFavoriteUpdate, onSaveSpend }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState(null);
  const [note, setNote] = useState(favoriteNote || "");
  const [status, setStatus] = useState(favoriteStatus || "want_to_go");
  const [userRating, setUserRating] = useState(favoriteRating || 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [noteSaved, setNoteSaved] = useState(false);
  const [spendValue, setSpendValue] = useState("");
  const [spendSaving, setSpendSaving] = useState(false);
  const [spendSaved, setSpendSaved] = useState(false);
  const [spendLogs, setSpendLogs] = useState([]);

  const fetchSpendLogs = (restaurantId) => {
    getSpendLogs(restaurantId).then(logs => setSpendLogs(Array.isArray(logs) ? logs : [])).catch(() => {});
  };

  useEffect(() => {
    if (isFavorited && favoriteStatus === "visited") {
      fetchSpendLogs(id);
    }
  }, [id, isFavorited, favoriteStatus]);

  useEffect(() => {
    setUserRating(favoriteRating || 0);
  }, [favoriteRating]);

  const handleSaveNote = async () => {
    if (!onSaveFavoriteUpdate) return;
    await onSaveFavoriteUpdate(id, { note, status, rating: userRating || null });
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const data = await getRestaurantDetails(id);
        setDetails(data);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, "Could not load restaurant details. Please try again."));
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <Modal onClose={onClose}>
        <div className="rdm-loading">
          <Spinner size="lg" />
          <p>Loading restaurant details...</p>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal onClose={onClose} maxWidth="500px">
        <div className="rdm-error">
          <Button variant="icon" className="rdm-close-btn" onClick={onClose} aria-label="Close">
            <FaTimes />
          </Button>
          <div className="error-message">
            <p>{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (!details) return null;

  const { name, location, coordinates, phone, rating, photos, hours, url, categories, price, aiSummary } = details;

  return (
    <Modal onClose={onClose}>
      <div className="rdm-inner">
        <Button variant="icon" className="rdm-close-btn" onClick={onClose} aria-label="Close details">
          <FaTimes />
        </Button>

        {onToggleFavorite && (
          <button
            className={`rdm-heart-btn${isFavorited ? " rdm-heart-btn--active" : ""}`}
            onClick={() => onToggleFavorite(id)}
            aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
          >
            {isFavorited ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}

        <PhotoGallery photos={photos} />

        <div className="restaurant-details">

          {/* ── Header ── */}
          <div className="rdm-header">
            <h2 className="rdm-title">{name}</h2>
            <div className="rdm-header-meta">
              <span className="rdm-rating-badge">
                <FaStar className="star-icon" /> {rating}
              </span>
              {price && <span className="rdm-price-badge">{price}</span>}
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="rdm-maps-link">
                  <FaExternalLinkAlt /> <span>Maps</span>
                </a>
              )}
            </div>
          </div>

          {/* ── AI Summary ── */}
          {aiSummary && (
            <div className="ai-summary">
              <span className="ai-summary-label">✦ AI Summary</span>
              <p>{aiSummary}</p>
            </div>
          )}

          {/* ── Categories ── */}
          {categories && categories.length > 0 && (
            <div className="categories">
              {categories.map((category, i) => (
                <Chip key={i} readOnly>{category.title}</Chip>
              ))}
            </div>
          )}

          {/* ── Contact ── */}
          <div className="contact-info">
            <div className="info-item">
              <FaMapMarkerAlt className="info-icon" />
              <p>{location.address1}, {location.city}, {location.state} {location.zip_code}</p>
            </div>
            {phone && (
              <div className="info-item">
                <FaPhone className="info-icon" />
                <p>{phone}</p>
              </div>
            )}
          </div>

          <HoursSection hours={hours} />

          {/* ── Personal note (shown only when favorited) ── */}
          {isFavorited && onSaveFavoriteUpdate && (
            <div className="rdm-notes">
              <h3 className="rdm-notes__title">My Note</h3>
              <div className="rdm-notes__status-row">
                <button
                  className={`rdm-status-btn${status === "want_to_go" ? " rdm-status-btn--active" : ""}`}
                  onClick={() => setStatus("want_to_go")}
                >
                  Want to Go
                </button>
                <button
                  className={`rdm-status-btn${status === "visited" ? " rdm-status-btn--active" : ""}`}
                  onClick={() => {
                    if (status !== "visited") {
                      setStatus("visited");
                      setSpendSaved(false);
                      setSpendValue("");
                      fetchSpendLogs(id);
                    }
                  }}
                >
                  ✓ Visited
                </button>
              </div>

              {status === "visited" && (
                <div className="rdm-star-rating">
                  <span className="rdm-star-label">Your Rating</span>
                  <div className="rdm-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className={`rdm-star${star <= (hoveredStar || userRating) ? " rdm-star--filled" : ""}`}
                        onClick={() => setUserRating(star === userRating ? 0 : star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {status === "visited" && onSaveSpend && (
                <div className="rdm-spend">
                  <span className="rdm-spend__label">💰 How much did you spend?</span>
                  {spendSaved ? (
                    <div className="rdm-spend__row">
                      <p className="rdm-spend__saved">Logged ✓ — ${parseFloat(spendValue).toFixed(2)}</p>
                      <button
                        className="rdm-spend__skip"
                        onClick={() => { setSpendSaved(false); setSpendValue(""); }}
                      >
                        + Log another visit
                      </button>
                    </div>
                  ) : (
                    <div className="rdm-spend__row">
                      <span className="rdm-spend__prefix">$</span>
                      <input
                        type="number"
                        className="rdm-spend__input"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={spendValue}
                        onChange={(e) => setSpendValue(e.target.value)}
                        aria-label="Log spend amount"
                      />
                      <button
                        className="rdm-spend__btn"
                        disabled={spendSaving || spendValue === "" || isNaN(parseFloat(spendValue))}
                        onClick={async () => {
                          const parsed = parseFloat(spendValue);
                          if (isNaN(parsed) || parsed < 0) return;
                          setSpendSaving(true);
                          try {
                            await onSaveSpend(id, parsed);
                            setSpendLogs(prev => [{ amount: parsed, visited_at: new Date().toISOString() }, ...prev]);
                            setSpendSaved(true);
                          } finally {
                            setSpendSaving(false);
                          }
                        }}
                      >
                        {spendSaving ? "…" : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {spendLogs.length > 0 && (
                <div className="rdm-spend-history">
                  <span className="rdm-spend-history__title">Visit History</span>
                  <ul className="rdm-spend-history__list">
                    {spendLogs.map((log, i) => (
                      <li key={i} className="rdm-spend-history__item">
                        <span className="rdm-spend-history__amount">${parseFloat(log.amount).toFixed(2)}</span>
                        <span className="rdm-spend-history__date">
                          {new Date(log.visited_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="rdm-spend-history__total">
                    Total: <strong>${spendLogs.reduce((s, l) => s + parseFloat(l.amount), 0).toFixed(2)}</strong>
                    <span className="rdm-spend-history__avg"> · avg ${(spendLogs.reduce((s, l) => s + parseFloat(l.amount), 0) / spendLogs.length).toFixed(2)}/visit</span>
                  </p>
                </div>
              )}
              <textarea
                className="rdm-notes__input"
                placeholder="Add a personal note… great for dates, parking tips, must-try dishes."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <button className="rdm-notes__save" onClick={handleSaveNote}>
                {noteSaved ? "Saved ✓" : "Save Note"}
              </button>
            </div>
          )}

          {coordinates && (
            <div className="map-section">
              <h3><FaMapMarkerAlt className="section-icon" /> Location</h3>
              <MapContainer
                center={[coordinates.latitude, coordinates.longitude]}
                zoom={15}
                style={{ height: "250px", borderRadius: "12px" }}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[coordinates.latitude, coordinates.longitude]}>
                  <Popup>{name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RestaurantDetailsModal;
