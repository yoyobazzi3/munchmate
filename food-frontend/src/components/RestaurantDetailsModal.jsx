import { useEffect, useState } from "react";
import { getRestaurantDetails } from "../services/restaurantService";
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
const RestaurantDetailsModal = ({ id, onClose, isFavorited, onToggleFavorite, favoriteNote, favoriteStatus, onSaveFavoriteUpdate }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState(null);
  const [note, setNote] = useState(favoriteNote || "");
  const [status, setStatus] = useState(favoriteStatus || "want_to_go");
  const [noteSaved, setNoteSaved] = useState(false);

  const handleSaveNote = async () => {
    if (!onSaveFavoriteUpdate) return;
    await onSaveFavoriteUpdate(id, { note, status });
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
                  onClick={() => setStatus("visited")}
                >
                  ✓ Visited
                </button>
              </div>
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
