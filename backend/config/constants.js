export const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

// Maps price filter values (from query params) to Google Places API price level enum strings
export const PRICE_MAP = {
  "1": "PRICE_LEVEL_INEXPENSIVE",
  "2": "PRICE_LEVEL_MODERATE",
  "3": "PRICE_LEVEL_EXPENSIVE",
  "4": "PRICE_LEVEL_VERY_EXPENSIVE",
};

// Maps sortBy query param values to Google Places API rankPreference enum strings
export const SORT_MAP = {
  rating: "RATING",
  distance: "DISTANCE",
};
