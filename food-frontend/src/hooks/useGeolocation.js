import { useState, useEffect } from "react";
import { getUserLocation } from "../utils/getLocation";

/**
 * useGeolocation — resolves the user's latitude/longitude via the browser's
 * Geolocation API (wrapped by getUserLocation).
 *
 * @param {Object}  [options]
 * @param {boolean} [options.enabled=true] - Set to false to skip the fetch
 *   (e.g. when the caller already has a text-based location).
 *
 * @returns {{ latitude: number|null, longitude: number|null, locationError: string|null, locationLoading: boolean }}
 */
const useGeolocation = ({ enabled = true } = {}) => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLocationLoading(false);
      return;
    }

    getUserLocation()
      .then((coords) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
      })
      .catch((err) => setLocationError(err.message || "Unable to get your location."))
      .finally(() => setLocationLoading(false));
  }, [enabled]);

  return { latitude, longitude, locationError, locationLoading };
};

export default useGeolocation;
