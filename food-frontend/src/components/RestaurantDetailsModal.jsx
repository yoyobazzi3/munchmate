import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { ENDPOINTS } from "../utils/apiEndpoints";
import { getErrorMessage } from "../utils/errorHandler";
import { FaTimes, FaMapMarkerAlt, FaPhone, FaStar, FaClock, FaExternalLinkAlt } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { Modal, Spinner, Chip, Button } from "./ui";
import "./RestaurantDetailsModal.css";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RestaurantDetailsModal = ({ id, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [error, setError] = useState(null);

  // Day mapping for hours
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Format time from military format to standard AM/PM
  const formatTime = (timeString) => {
    if (!timeString) return "";
    
    const hours = timeString.substring(0, 2);
    const minutes = timeString.substring(2);
    
    let period = "AM";
    let hour = parseInt(hours);
    
    if (hour >= 12) {
      period = "PM";
      if (hour > 12) hour -= 12;
    }
    if (hour === 0) hour = 12;
    
    return `${hour}:${minutes} ${period}`;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Fetch full restaurant details from the backend using the restaurant ID
        const response = await api.get(ENDPOINTS.RESTAURANTS.DETAILS(id));
        setDetails(response.data);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, "Could not load restaurant details. Please try again."));
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
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
        
        {/* Photo Gallery */}
        {photos && photos.length > 0 && (
          <div className="photo-gallery">
            <div className="main-photo" style={{ backgroundImage: `url(${photos[activePhoto]})` }}>
              {photos.length > 1 && (
                <>
                  <button 
                    className="photo-nav prev" 
                    onClick={() => setActivePhoto((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                    aria-label="Previous photo"
                  >
                    ‹
                  </button>
                  <button 
                    className="photo-nav next" 
                    onClick={() => setActivePhoto((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                    aria-label="Next photo"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="photo-thumbnails">
                {photos.map((photo, i) => (
                  <div 
                    key={i} 
                    className={`thumbnail ${i === activePhoto ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${photo})` }}
                    onClick={() => setActivePhoto(i)}
                    aria-label={`Photo ${i+1} of ${photos.length}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
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
          
          {/* Hours Section */}
          {hours && hours[0]?.open && (
            <div className="hours-section">
              <h3><FaClock className="section-icon" /> Hours</h3>
              <div className="hours-list">
                {days.map((day, index) => {
                  const dayHours = hours[0].open.find(h => h.day === index);
                  return (
                    <div key={index} className="hours-item">
                      <span className="day">{day}</span>
                      <span className="time">
                        {dayHours
                          ? `${formatTime(dayHours.start)} - ${formatTime(dayHours.end)}`
                          : "Closed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map Section */}
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