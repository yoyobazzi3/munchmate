import { useMemo } from "react";

export const useViewBasedRecommendations = (restaurants, recentlyViewed) => {
  return useMemo(() => {
    if (!recentlyViewed.length || !restaurants.length) return [];

    const viewedIds     = new Set(recentlyViewed.map((r) => r.id));
    const recentAliases = new Set(
      recentlyViewed.flatMap((r) => r.categories?.map((c) => c.alias) || [])
    );

    return restaurants
      .filter(
        (r) =>
          !viewedIds.has(r.id) &&
          r.categories?.some((c) => recentAliases.has(c.alias))
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [recentlyViewed, restaurants]);
};
