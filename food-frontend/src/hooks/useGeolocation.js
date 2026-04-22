import { useState, useEffect, useCallback } from "react";
import { getUserLocation } from "../utils/getLocation";

/**
 * useGeolocation — resolves the user's latitude/longitude via the browser's
 * Geolocation API (wrapped by getUserLocation).
 *
 * @param {Object}  [options]
 * @param {boolean} [options.enabled=true] - Set to false to skip the fetch
 *   (e.g. when the caller already has a text-based location).
 *
 * @returns {{ latitude: number|null, longitude: number|null, locationError: string|null, locationLoading: boolean, requestLocation: function }}
 */
const useGeolocation = ({ enabled = true } = {}) => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(enabled);

  const fetchLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);
    getUserLocation()
      .then((coords) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
      })
      .catch((err) => setLocationError(err.message || "Unable to get your location."))
      .finally(() => setLocationLoading(false));
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLocationLoading(false);
      return;
    }
    fetchLocation();
  }, [enabled, fetchLocation]);

  return { latitude, longitude, locationError, locationLoading, requestLocation: fetchLocation };
};

export default useGeolocation;
