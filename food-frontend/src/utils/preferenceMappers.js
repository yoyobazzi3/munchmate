import { CUISINE_TO_YELP, SYMBOL_TO_NUM } from "./constants";

/** Maps an array of cuisine display names to their Yelp API aliases. */
export const mapCuisinesToYelp = (favoriteCuisines = []) =>
  favoriteCuisines.map((c) => CUISINE_TO_YELP[c]).filter(Boolean);

/**
 * Converts a preferences object into filter params ready for the restaurant API.
 * @returns {{ price: string, category: string }}
 */
export const mapPreferencesToFilters = (preferences = {}) => ({
  price: SYMBOL_TO_NUM[preferences.preferredPriceRange] || "",
  category: mapCuisinesToYelp(preferences.favoriteCuisines).join(","),
});
