import { useState, useEffect } from "react";
import { CUISINE_TO_YELP, SYMBOL_TO_NUM, PRICE_LABELS } from "../utils/constants";

/**
 * Filters restaurants by the user's saved cuisine and price preferences.
 * Used on the Home page.
 *
 * @param {Array}  restaurants - Full list of nearby restaurants
 * @param {Object} preferences - User preferences from PreferencesContext
 * @param {number} count       - Maximum number of results to return
 * @returns {Array}
 */
export const usePreferenceRecommendations = (restaurants, preferences, count) => {
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    if (!preferences || !restaurants.length) return;

    const priceNum    = SYMBOL_TO_NUM[preferences.preferredPriceRange] || "";
    const cuisineList = (preferences.favoriteCuisines || [])
      .map((c) => CUISINE_TO_YELP[c])
      .filter(Boolean);

    // No meaningful preferences set — show nothing rather than matching everything.
    if (!cuisineList.length && !priceNum) {
      setRecommended([]);
      return;
    }

    const filtered = restaurants.filter((r) => {
      const matchesCuisine =
        cuisineList.length === 0 ||
        r.categories?.some((cat) => cuisineList.includes(cat.alias));
      const matchesPrice =
        !priceNum || r.price === PRICE_LABELS[parseInt(priceNum) - 1];
      return matchesCuisine || matchesPrice;
    });

    setRecommended(filtered.slice(0, count));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, preferences]); // count is stable for a component's lifetime

  return recommended;
};

/**
 * Recommends restaurants based on the user's recently-viewed history.
 * Excludes already-viewed restaurants and ranks by rating.
 * Used on the Restaurants page.
 *
 * @param {Array} restaurants    - Full list of search results
 * @param {Array} recentlyViewed - Recently viewed restaurants from useRecentlyViewed
 * @returns {Array}
 */
export const useViewBasedRecommendations = (restaurants, recentlyViewed) => {
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    if (!recentlyViewed.length || !restaurants.length) return;

    const viewedIds     = new Set(recentlyViewed.map((r) => r.id));
    const recentAliases = new Set(
      recentlyViewed.flatMap((r) => r.categories?.map((c) => c.alias) || [])
    );

    const recs = restaurants
      .filter(
        (r) =>
          !viewedIds.has(r.id) &&
          r.categories?.some((c) => recentAliases.has(c.alias))
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    setRecommended(recs);
  }, [recentlyViewed, restaurants]);

  return recommended;
};
