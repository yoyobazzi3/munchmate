import { useState, useEffect, useCallback } from "react";
import { getRestaurants } from "../services/restaurantService";
import { CUISINES, SEARCH_DEBOUNCE_MS } from "../utils/constants";

/**
 * Fetches and returns search suggestions (restaurants + cuisines) for a given term.
 *
 * @param {string} searchTerm
 * @param {{ latitude: number|null, longitude: number|null }} userLocation
 * @returns {{ suggestions: Array, isLoading: boolean, clearSuggestions: Function }}
 */
const useSuggestions = (searchTerm, userLocation) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading]     = useState(false);

  const fetchSuggestions = useCallback(async (term) => {
    setIsLoading(true);
    try {
      const data = await getRestaurants({
        term,
        latitude : userLocation?.latitude,
        longitude: userLocation?.longitude,
        limit    : 5,
      });

      const restaurantSuggestions = data.map((r) => ({
        text: r.name,
        type: "restaurant",
        id  : r.id,
      }));

      const cuisineSuggestions = term.length > 2
        ? CUISINES
            .filter((c) => c.toLowerCase().includes(term.toLowerCase()))
            .slice(0, 2)
            .map((c) => ({ text: `${c} Restaurants`, type: "cuisine", id: c.toLowerCase() }))
        : [];

      setSuggestions([...cuisineSuggestions, ...restaurantSuggestions]);
    } catch (err) {
      console.error("Suggestion error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm.length > 1) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(delay);
  }, [searchTerm, fetchSuggestions]);

  return { suggestions, isLoading, clearSuggestions: () => setSuggestions([]) };
};

export default useSuggestions;
