export const validateChatMessage = (message) => {
  if (!message) {
    return { isValid: false, error: "Message is required" };
  }
  if (message.length > 500) {
    return { isValid: false, error: "Message must be 500 characters or fewer" };
  }
  return { isValid: true };
};

// ── /getRestaurants query validation ──────────────────────────────────────────

const VALID_SORT_BY      = new Set(["best_match", "rating", "distance"]);
const VALID_DINING       = new Set(["all", "dine-in", "takeout", "delivery"]);
const VALID_PRICE_VALUES = new Set(["1", "2", "3", "4"]);
const MAX_STRING_LEN     = 200; // max chars for free-text fields

/**
 * Validates all query params accepted by GET /getRestaurants.
 * Returns { isValid: true } on success or { isValid: false, error: string } on failure.
 */
export const validateRestaurantQuery = (query) => {
  const {
    latitude, longitude, location,
    radius = "5000",
    price,
    sortBy = "best_match",
    term = "",
    category = "",
    diningOption = "all",
  } = query;

  // ── Location ─────────────────────────────────────────────────────────────────
  const hasCoords   = latitude !== undefined && longitude !== undefined;
  const hasLocation = location !== undefined && String(location).trim() !== "";

  if (!hasCoords && !hasLocation) {
    return { isValid: false, error: "Provide latitude+longitude or a location string." };
  }

  if (hasCoords) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      return { isValid: false, error: "latitude and longitude must be numeric." };
    }
    if (lat < -90 || lat > 90) {
      return { isValid: false, error: "latitude must be between -90 and 90." };
    }
    if (lon < -180 || lon > 180) {
      return { isValid: false, error: "longitude must be between -180 and 180." };
    }
  }

  if (hasLocation && String(location).length > MAX_STRING_LEN) {
    return { isValid: false, error: `location must be ${MAX_STRING_LEN} characters or fewer.` };
  }

  // ── Radius ───────────────────────────────────────────────────────────────────
  const r = parseFloat(radius);
  if (isNaN(r) || r <= 0) {
    return { isValid: false, error: "radius must be a positive number." };
  }
  if (r > 50000) {
    return { isValid: false, error: "radius must not exceed 50,000 metres (50 km)." };
  }

  // ── Price ────────────────────────────────────────────────────────────────────
  if (price !== undefined) {
    const priceValues = String(price).split(",").filter(Boolean);
    if (priceValues.length === 0) {
      return { isValid: false, error: "price must not be empty when provided." };
    }
    const invalid = priceValues.find(p => !VALID_PRICE_VALUES.has(p));
    if (invalid) {
      return { isValid: false, error: `Invalid price value "${invalid}". Accepted: 1, 2, 3, 4.` };
    }
  }

  // ── sortBy ───────────────────────────────────────────────────────────────────
  if (!VALID_SORT_BY.has(sortBy)) {
    return {
      isValid: false,
      error: `Invalid sortBy "${sortBy}". Accepted: ${[...VALID_SORT_BY].join(", ")}.`,
    };
  }

  // ── diningOption ─────────────────────────────────────────────────────────────
  if (!VALID_DINING.has(diningOption)) {
    return {
      isValid: false,
      error: `Invalid diningOption "${diningOption}". Accepted: ${[...VALID_DINING].join(", ")}.`,
    };
  }

  // ── Free-text length caps ─────────────────────────────────────────────────────
  if (term && String(term).length > MAX_STRING_LEN) {
    return { isValid: false, error: `term must be ${MAX_STRING_LEN} characters or fewer.` };
  }
  if (category && String(category).length > MAX_STRING_LEN) {
    return { isValid: false, error: `category must be ${MAX_STRING_LEN} characters or fewer.` };
  }

  return { isValid: true };
};
