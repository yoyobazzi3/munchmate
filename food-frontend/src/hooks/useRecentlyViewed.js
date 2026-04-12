import { useState, useEffect, useCallback } from "react";
import { getClickHistory, trackClick } from "../services/restaurantService";
import { getUser } from "../utils/tokenService";

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

  const fetchRecentlyViewed = useCallback(async () => {
    try {
      const user = getUser();
      if (!user?.id) return;
      const data = await getClickHistory(user.id);
      if (data?.length) setRecentlyViewed(data);
    } catch (err) {
      console.error("Error fetching click history:", err);
    }
  }, []);

  // Load on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRecentlyViewed(); }, []);

  // Track click whenever a restaurant is selected
  useEffect(() => {
    const user = getUser();
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
