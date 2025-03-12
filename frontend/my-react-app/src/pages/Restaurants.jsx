import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { getUserLocation } from "../utils/getLocation";

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState("");

  useEffect(() => {
    const fetchRestaurants = async (latitude, longitude) => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/google/nearby-restaurants?latitude=${latitude}&longitude=${longitude}`
        );
        const data = await response.json();
        setRestaurants(data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    // Get location or allow manual input
    getUserLocation()
      .then((location) => {
        setUserLocation(location);
        fetchRestaurants(location.latitude, location.longitude);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Handle Manual Location Search
  const handleManualLocation = async () => {
    if (!manualLocation) return;
    
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    
    try {
      console.log("Fetching coordinates for:", manualLocation);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(manualLocation)}&key=${apiKey}`
      );
      const data = await response.json();
  
      console.log("Geocode API Response:", data);
  
      if (data.status === "OK") {
        const { lat, lng } = data.results[0].geometry.location;
        setUserLocation({ latitude: lat, longitude: lng });
        fetchRestaurants(lat, lng);
      } else {
        alert("Location not found. Check API restrictions.");
      }
    } catch (error) {
      console.error("Geocoding Error:", error);
      alert("Error fetching location.");
    }
  };

  return (
    <div className="restaurants-container">
      <h2>Nearby Restaurants</h2>

      {/* If location is blocked, allow manual input */}
      {!userLocation && (
        <div>
          <p>Location access denied. Enter a city or ZIP code:</p>
          <input
            type="text"
            placeholder="Enter location..."
            value={manualLocation}
            onChange={(e) => setManualLocation(e.target.value)}
          />
          <button onClick={handleManualLocation}>Find Restaurants</button>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {/* Display Map */}
          {userLocation && (
            <LoadScript googleMapsApiKey={GOOGLE_API_KEY}>
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "400px" }}
                center={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                zoom={14}
              >
                <Marker position={{ lat: userLocation.latitude, lng: userLocation.longitude }} label="You" />

                {restaurants.map((restaurant) => (
                  <Marker
                    key={restaurant.place_id}
                    position={{
                      lat: restaurant.geometry.location.lat,
                      lng: restaurant.geometry.location.lng
                    }}
                    label={restaurant.name}
                  />
                ))}
              </GoogleMap>
            </LoadScript>
          )}

          {/* Restaurant List */}
          <ul className="restaurant-list">
            {restaurants.map((restaurant) => (
              <li key={restaurant.place_id}>
                <h3>{restaurant.name}</h3>
                <p>Rating: {restaurant.rating} ⭐</p>
                <p>{restaurant.vicinity}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Restaurants;