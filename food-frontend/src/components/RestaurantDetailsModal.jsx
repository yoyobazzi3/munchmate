import { useEffect, useState } from "react";
import { getRestaurantDetails } from "../services/restaurantService";
import { getErrorMessage } from "../utils/errorHandler";
import { FaTimes, FaMapMarkerAlt, FaPhone, FaStar, FaExternalLinkAlt } from "react-icons/fa";
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

const RestaurantDetailsModal = ({ id, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState(null);

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

  const { name, location, coordinates, phone, rating, photos, hours, url, categories, price } = details;

  return (
    <Modal onClose={onClose}>
      <div className="rdm-inner">
        <Button variant="icon" className="rdm-close-btn" onClick={onClose} aria-label="Close details">
          <FaTimes />
        </Button>

        <PhotoGallery photos={photos} />

        <div className="restaurant-details">
          <div className="details-header">
            <h2>{name}</h2>
            <div className="rating-price">
              <div className="rating">
                <FaStar className="star-icon" />
                <span>{rating}</span>
              </div>
              {price && <div className="price">{price}</div>}
            </div>
          </div>

          {categories && categories.length > 0 && (
            <div className="categories">
              {categories.map((category, i) => (
                <Chip key={i} readOnly>{category.title}</Chip>
              ))}
            </div>
          )}

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

            <div className="info-item">
              <FaExternalLinkAlt className="info-icon" />
              <a href={url} target="_blank" rel="noreferrer" className="yelp-link">
                View on Google Maps
              </a>
            </div>
          </div>

          <HoursSection hours={hours} />

          {coordinates && (
            <div className="map-section">
              <h3><FaMapMarkerAlt className="section-icon" /> Location</h3>
              <MapContainer
                center={[coordinates.latitude, coordinates.longitude]}
                zoom={15}
                style={{ height: "250px", borderRadius: "8px" }}
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
