// ── Cuisine constants ──────────────────────────────────────────────────────────

/**
 * Display names for cuisine chips shown across Profile, Filter, and SearchBar.
 * The order here controls the order they appear in the UI.
 */
export const CUISINES = [
  "Italian", "Japanese", "Mexican", "Indian",
  "Chinese", "American", "Pizza", "Burgers", "Sushi",
];

/**
 * Maps a cuisine display name to its Google Places / Yelp API alias.
 * Used when building search queries from user preferences.
 * Must stay in sync with the CUISINES array above.
 */
export const CUISINE_TO_YELP = {
  Italian: "italian",
  Japanese: "japanese",
  Mexican: "mexican",
  Indian: "indpak",
  Chinese: "chinese",
  American: "american",
  Pizza: "pizza",
  Burgers: "burgers",
  Sushi: "sushi",
};


// ── Price constants ────────────────────────────────────────────────────────────

/** Price tier labels shown in UI chips and filter buttons. */
export const PRICE_LABELS = ["$", "$$", "$$$", "$$$$"];

/**
 * Maps a price symbol to its numeric filter value expected by the backend.
 * Used when converting a user's saved preference into an API query param.
 */
export const SYMBOL_TO_NUM = { "$": "1", "$$": "2", "$$$": "3", "$$$$": "4" };

// ── Unit conversion ────────────────────────────────────────────────────────────

/** Meters in one mile — used when converting the radius slider value for the API. */
export const METERS_PER_MILE = 1609.34;

// ── Search radius bounds (meters) ──────────────────────────────────────────────

export const MIN_RADIUS_METERS = 1609;
export const MAX_RADIUS_METERS = 40234;

/** Default search radius used on the Home page initial fetch. */
export const DEFAULT_SEARCH_RADIUS_HOME = 8000;

// ── Debounce ───────────────────────────────────────────────────────────────────

export const SEARCH_DEBOUNCE_MS = 300;

// ── Pagination ─────────────────────────────────────────────────────────────────

export const ITEMS_PER_PAGE = 12;
export const PAGINATION_WINDOW = 5;

// ── Home page ──────────────────────────────────────────────────────────────────

export const POPULAR_RESTAURANTS_COUNT = 4;
export const RECOMMENDED_RESTAURANTS_COUNT = 4;

// ── Days of the week ───────────────────────────────────────────────────────────

/** Ordered Mon–Sun, matching the day index returned by the Yelp hours API. */
export const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];
