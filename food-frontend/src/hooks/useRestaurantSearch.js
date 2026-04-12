import { useState, useEffect, useCallback } from "react";
import { getRestaurants } from "../services/restaurantService";

/**
 * useRestaurantSearch — fetches restaurants whenever `filters` changes,
 * provided `enabled` is true (i.e. preferences have been loaded and a
 * location is available).
 *
 * @param {Object}  filters    - Search parameters forwarded to getRestaurants
 * @param {boolean} enabled    - Gate flag; fetch is skipped while false
 *
 * @returns {{
 *   restaurants: Array,
 *   loading: boolean,
 *   initialLoad: boolean,
 *   error: string|null,
 *   fetchRestaurants: () => Promise<void>
 * }}
 */
const useRestaurantSearch = (filters, enabled) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  const fetchRestaurants = useCallback(async () => {
    if (!enabled) return;
    if (
      (!filters.location || filters.location.trim() === "") &&
      (!filters.latitude || !filters.longitude)
    ) return;

    setLoading(true);
    setError(null);

    try {
      let data = await getRestaurants(filters);
      if (filters.minRating) {
        data = data.filter((r) => r.rating >= parseFloat(filters.minRating));
      }
      setRestaurants(data);
      setInitialLoad(false);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError("Failed to load restaurants. Please try again.");
      setInitialLoad(false);
    }

    setLoading(false);
  }, [filters, enabled]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return { restaurants, loading, initialLoad, error, fetchRestaurants };
};

export default useRestaurantSearch;
