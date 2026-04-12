import { useState, useEffect } from "react";

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
