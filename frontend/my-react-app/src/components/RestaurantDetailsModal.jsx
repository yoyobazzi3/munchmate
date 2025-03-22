import { useEffect, useState } from "react";
import axios from "axios";
import "./RestaurantDetailsModal.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const RestaurantDetailsModal = ({ id, onClose }) => {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/getRestaurantDetails/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetails(response.data);
    };

    if (id) fetchDetails();
  }, [id]);

  if (!details) return (
    <div className="modal-overlay"><div className="modal-content">Loading...</div></div>
  );

  const { name, location, coordinates, phone, rating, photos, hours, url } = details;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>X</button>
        <h2>{name}</h2>
        <p>{location.address1}, {location.city}</p>
        <p>{phone}</p>
        <p>⭐ {rating}</p>
        <a href={url} target="_blank" rel="noreferrer">View on Yelp</a>

        {photos && (
          <div className="photo-row">
            {photos.map((url, i) => (
              <img key={i} src={url} alt="restaurant" />
            ))}
          </div>
        )}

        {coordinates && (
          <MapContainer
            center={[coordinates.latitude, coordinates.longitude]}
            zoom={15}
            style={{ height: "300px", marginTop: "20px", borderRadius: "8px" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[coordinates.latitude, coordinates.longitude]}>
              <Popup>{name}</Popup>
            </Marker>
          </MapContainer>
        )}

        {hours && hours[0]?.open && (
          <div className="hours">
            <h4>Hours</h4>
            {hours[0].open.map((h, i) => (
              <p key={i}>Day {h.day}: {h.start} - {h.end}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetailsModal;