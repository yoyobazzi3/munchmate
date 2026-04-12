import { CUISINE_TO_YELP, SYMBOL_TO_NUM } from "./constants";

/**
 * Transforms an array of frontend display names into standardized Yelp API cuisine aliases.
 *
 * @param {Array<string>} [favoriteCuisines=[]] - The list of local user-facing cuisines.
 * @returns {Array<string>} Corresponding Yelp API category identifiers filtering out any mismatch.
 */
export const mapCuisinesToYelp = (favoriteCuisines = []) =>
  favoriteCuisines.map((c) => CUISINE_TO_YELP[c]).filter(Boolean);

/**
 * Condenses a generalized user preferences matrix into literal route parameters ready for Restaurant queries.
 *
 * @param {Object} [preferences={}] - User preferences payload from Context.
 * @returns {{ price: string, category: string }} The mapped parameters payload.
 */
export const mapPreferencesToFilters = (preferences = {}) => ({
  price: SYMBOL_TO_NUM[preferences.preferredPriceRange] || "",
  category: mapCuisinesToYelp(preferences.favoriteCuisines).join(","),
});
