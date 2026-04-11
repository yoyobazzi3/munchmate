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
