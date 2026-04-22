import { useState, useEffect, useCallback } from "react";
import { getClickHistory, trackClick } from "../services/restaurantService";
import { useUser } from "../context/UserContext";

/**
 * useRecentlyViewed — fetches the user's click history on mount and
 * automatically tracks a new click whenever `selectedRestaurantId` changes.
 *
 * @param {string|null} selectedRestaurantId - ID of the restaurant just opened
 *
 * @returns {{
 *   recentlyViewed: Array,
 *   fetchRecentlyViewed: () => Promise<void>
 * }}
 */
const useRecentlyViewed = (selectedRestaurantId) => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const { user } = useUser();

  const fetchRecentlyViewed = useCallback(async () => {
    try {
      if (!user?.id) return;
      const data = await getClickHistory(user.id);
      if (data?.length) setRecentlyViewed(data);
    } catch (err) {
      console.error("Error fetching click history:", err);
    }
  }, [user]);

  // Load on mount and whenever the logged-in user changes
  useEffect(() => { fetchRecentlyViewed(); }, [fetchRecentlyViewed]);

  // Track click whenever a restaurant is selected
  useEffect(() => {
    if (!selectedRestaurantId || !user?.id) return;

    (async () => {
      try {
        await trackClick(selectedRestaurantId);
        fetchRecentlyViewed();
      } catch (err) {
        console.error("Tracking click failed:", err);
      }
    })();
  }, [selectedRestaurantId, fetchRecentlyViewed]);

  return { recentlyViewed, fetchRecentlyViewed };
};

export default useRecentlyViewed;
