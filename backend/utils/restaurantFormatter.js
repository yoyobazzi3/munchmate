export const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

/**
 * Maps price levels passed from frontend parameters to Google Places API enum values.
 */
export const PRICE_MAP = {
  "1": "PRICE_LEVEL_INEXPENSIVE",
  "2": "PRICE_LEVEL_MODERATE",
  "3": "PRICE_LEVEL_EXPENSIVE",
  "4": "PRICE_LEVEL_VERY_EXPENSIVE",
};

/**
 * Maps sorting options from frontend to Google Places API ranking preferences.
 */
export const SORT_MAP = {
  rating: "RATING",
  distance: "DISTANCE",
};

/**
 * Converts a Google price level enum string to its symbolic representation ($, $$, etc.).
 * @param {string} level - The Google Places price level enum.
 * @returns {string|null} The dollar symbol representation or null if not applicable.
 */
export const priceToSymbol = (level) => ({
  PRICE_LEVEL_FREE: "$",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
}[level] || null);

/**
 * Builds the internal API URL used to proxy Google Places images.
 * @param {string} photoReference - The photo reference id from Google Places API.
 * @param {number} [width=400] - The desired width of the photo.
 * @param {string} [backendUrl=''] - The backend root URL to point proxy requests to.
 * @returns {string|null} The constructed URL or null if no reference was given.
 */
export const buildImageUrl = (photoReference, width = 400, backendUrl = '') => {
  if (!photoReference) return null;
  return `${backendUrl}/image-proxy?ref=${encodeURIComponent(photoReference)}&w=${width}`;
};

/**
 * Normalizes raw Google Places API responses down to a standardized structure
 * that the frontend Application expects.
 * @param {Array} places - Array of place objects from Google API.
 * @param {string} backendUrl - The backend base URL used for image proxies.
 * @returns {Array} List of formatted and standardized restaurant objects.
 */
export const normalizePlaces = (places, backendUrl) =>
  places.map(place => ({
    id: place.id,
    name: place.displayName?.text || "",
    rating: place.rating || 0,
    review_count: place.userRatingCount || 0,
    price: priceToSymbol(place.priceLevel),
    image_url: buildImageUrl(place.photos?.[0]?.name, 400, backendUrl),
    location: {
      address1: place.shortFormattedAddress || place.formattedAddress || "",
    },
    coordinates: {
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
    },
    categories: (place.types || []).slice(0, 2).map(t => ({
      alias: t,
      title: t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    })),
    url: place.googleMapsUri || "",
    dineIn: place.dineIn ?? null,
    takeout: place.takeout ?? null,
    delivery: place.delivery ?? null,
  }));

/**
 * Normalizes a locally cached database restaurant row back into the standard schema.
 * 
 * @param {Array} rows - Array of database restaurant records.
 * @param {string} backendUrl - The backend base URL used for image proxies.
 * @returns {Array} List of formatted and standardized restaurant objects.
 */
export const normalizeDatabasePlace = (rows, backendUrl) =>
  rows.map(r => ({
    id: r.id,
    name: r.name,
    rating: r.rating,
    review_count: r.review_count,
    price: r.price,
    image_url: buildImageUrl(r.photo_reference, 400, backendUrl),
    location: { address1: r.address },
    coordinates: { latitude: r.latitude, longitude: r.longitude },
    categories: r.category ? [{ alias: r.category, title: r.category }] : [],
  }));

// Convert Google day (0=Sun) to Yelp day (0=Mon)
const googleToYelpDay = d => (d === 0 ? 6 : d - 1);

const toYelpTime = (hour, minute) =>
  String(hour).padStart(2, "0") + String(minute || 0).padStart(2, "0");

const getComponent = (components, type) =>
  components?.find(c => c.types?.includes(type))?.longText || "";

/**
 * Maps a raw detailed Google Place object entirely into the MunchMate application standard schema.
 * 
 * @param {Object} p - The raw place object fetched from Google.
 * @param {string} backendUrl - Reference URL for proxying images.
 * @returns {Object} Cleanly formatted restaurant detail object.
 */
export const formatRestaurantDetails = (p, backendUrl) => {
  // Build photo URLs (up to 5) — proxied to keep the API key server-side
  const photos = (p.photos || []).slice(0, 5)
    .map(photo => buildImageUrl(photo.name, 800, backendUrl))
    .filter(Boolean);

  // Convert opening hours to Yelp format
  let hours = undefined;
  if (p.regularOpeningHours?.periods?.length) {
    const open = p.regularOpeningHours.periods.map(period => ({
      day: googleToYelpDay(period.open.day),
      start: toYelpTime(period.open.hour, period.open.minute),
      end: toYelpTime(period.close?.hour ?? 23, period.close?.minute ?? 59),
    }));
    hours = [{ open }];
  }

  const components = p.addressComponents || [];

  return {
    id: p.id,
    name: p.displayName?.text || "",
    rating: p.rating || 0,
    review_count: p.userRatingCount || 0,
    price: priceToSymbol(p.priceLevel),
    phone: p.nationalPhoneNumber || "",
    url: p.googleMapsUri || p.websiteUri || "",
    photos,
    hours,
    location: {
      address1: `${getComponent(components, "street_number")} ${getComponent(components, "route")}`.trim()
        || p.formattedAddress || "",
      city: getComponent(components, "locality"),
      state: getComponent(components, "administrative_area_level_1"),
      zip_code: getComponent(components, "postal_code"),
    },
    coordinates: {
      latitude: p.location?.latitude,
      longitude: p.location?.longitude,
    },
    categories: (p.types || []).slice(0, 3).map(t => ({
      alias: t,
      title: t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    })),
  };
};
