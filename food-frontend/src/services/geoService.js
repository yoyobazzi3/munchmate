/**
 * geoService.js — Geolocation API Layer
 *
 * Centralizes HTTP calls for geographic lookups such as reverse geocoding
 * (converting lat/lon coordinates into a human-readable location name).
 *
 * Every function:
 *  - Returns the parsed response body (`response.data`) on success
 *  - Lets Axios errors propagate so callers can handle them with try/catch
 */

import api from "../utils/axiosInstance";
import { ENDPOINTS } from "../utils/apiEndpoints";

/**
 * Converts geographic coordinates into a human-readable address via the
 * backend reverse-geocode proxy (backed by the Nominatim / OpenStreetMap API).
 *
 * The response `address` object typically includes:
 *  - `city`    — primary city name
 *  - `town`    — town name (fallback when `city` is absent)
 *  - `suburb`  — suburb / neighbourhood name (secondary fallback)
 *  - `country` — country name
 *
 * @param {number} lat - Latitude coordinate
 * @param {number} lon - Longitude coordinate
 * @returns {Promise<Object>} Geocode response from the backend
 * @returns {Object} .address - Address breakdown object
 */
export const reverseGeocode = (lat, lon) =>
  api
    .get(ENDPOINTS.GEO.REVERSE_GEOCODE, { params: { lat, lon } })
    .then((res) => res.data);
