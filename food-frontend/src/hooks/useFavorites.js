import { useState, useEffect, useCallback } from "react";
import { getFavorites, addFavorite, removeFavorite, updateFavorite } from "../services/favoritesService";
import { useUser } from "../context/UserContext";

const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const { user } = useUser();

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getFavorites();
      if (Array.isArray(data)) setFavorites(data);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const isFavorited = useCallback(
    (restaurantId) => favorites.some((r) => r.id === restaurantId),
    [favorites]
  );

  const toggleFavorite = useCallback(async (restaurantId) => {
    const alreadyFaved = favorites.some((r) => r.id === restaurantId);
    // Optimistic update
    if (alreadyFaved) {
      setFavorites((prev) => prev.filter((r) => r.id !== restaurantId));
      try {
        await removeFavorite(restaurantId);
      } catch {
        fetchFavorites();
      }
    } else {
      try {
        await addFavorite(restaurantId);
        fetchFavorites();
      } catch (err) {
        console.error("Error adding favorite:", err);
      }
    }
  }, [favorites, fetchFavorites]);

  const saveFavoriteUpdate = useCallback(async (restaurantId, { note, status }) => {
    setFavorites(prev =>
      prev.map(r => r.id === restaurantId ? { ...r, note, status } : r)
    );
    try {
      await updateFavorite(restaurantId, { note, status });
    } catch {
      fetchFavorites();
    }
  }, [fetchFavorites]);

  return { favorites, isFavorited, toggleFavorite, saveFavoriteUpdate };
};

export default useFavorites;
