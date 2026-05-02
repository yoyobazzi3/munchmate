import { useState, useEffect, useCallback } from "react";
import { getUserLocation } from "../utils/getLocation";

const COORD_CACHE_KEY = "munchmate_last_coords";
const COORD_CACHE_TTL = 30 * 60 * 1000;

function readCachedCoords() {
  try {
    const raw = localStorage.getItem(COORD_CACHE_KEY);
    if (!raw) return null;
    const { latitude, longitude, ts } = JSON.parse(raw);
    if (Date.now() - ts > COORD_CACHE_TTL) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

function writeCachedCoords(latitude, longitude) {
  try {
    localStorage.setItem(COORD_CACHE_KEY, JSON.stringify({ latitude, longitude, ts: Date.now() }));
  } catch {
    // ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

/**
 * useGeolocation — resolves the user's latitude/longitude via the browser's
 * Geolocation API (wrapped by getUserLocation).
 *
 * Coordinates are persisted to localStorage so subsequent page loads hydrate
 * instantly from cache instead of waiting for the async geolocation call.
 *
 * @param {Object}  [options]
 * @param {boolean} [options.enabled=true] - Set to false to skip the fetch
 *   (e.g. when the caller already has a text-based location).
 *
 * @returns {{ latitude: number|null, longitude: number|null, locationError: string|null, locationLoading: boolean, requestLocation: function }}
 */
const useGeolocation = ({ enabled = true } = {}) => {
  // Lazy initializers run once on mount — localStorage reads are synchronous and safe here
  const [latitude,        setLatitude       ] = useState(() => (enabled ? readCachedCoords()?.latitude  : null) ?? null);
  const [longitude,       setLongitude      ] = useState(() => (enabled ? readCachedCoords()?.longitude : null) ?? null);
  const [locationError,   setLocationError  ] = useState(null);
  // Skip the loading spinner if we already have cached coords — restaurants show right away
  const [locationLoading, setLocationLoading] = useState(() => enabled && !readCachedCoords());

  const fetchLocation = useCallback((silent = false) => {
    if (!silent) setLocationLoading(true);
    setLocationError(null);
    getUserLocation()
      .then((coords) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        writeCachedCoords(coords.latitude, coords.longitude);
      })
      .catch((err) => {
        if (!silent) setLocationError(err.message || "Unable to get your location.");
      })
      .finally(() => { if (!silent) setLocationLoading(false); });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Silently refresh in background if cached coords are already loaded
    fetchLocation(!!readCachedCoords());
  }, [enabled, fetchLocation]);

  return {
    latitude,
    longitude,
    locationError,
    locationLoading: enabled && locationLoading,
    requestLocation: () => fetchLocation(false),
  };
};

export default useGeolocation;
