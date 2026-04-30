import { useState, useEffect, useCallback } from "react";
import { getFavorites, addFavorite, removeFavorite, updateFavorite, updateSpend } from "../services/favoritesService";
import { useUser } from "../context/UserContext";

const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await getFavorites();
      if (Array.isArray(data)) setFavorites(data);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setIsLoading(false);
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

  const saveFavoriteUpdate = useCallback(async (restaurantId, { note, status, rating }) => {
    setFavorites(prev =>
      prev.map(r => r.id === restaurantId ? { ...r, note, status, rating } : r)
    );
    try {
      await updateFavorite(restaurantId, { note, status, rating });
    } catch {
      fetchFavorites();
    }
  }, [fetchFavorites]);

  const saveSpend = useCallback(async (restaurantId, amount) => {
    setFavorites(prev =>
      prev.map(r => r.id === restaurantId ? { ...r, amount_spent: amount } : r)
    );
    try {
      await updateSpend(restaurantId, amount);
    } catch {
      fetchFavorites();
    }
  }, [fetchFavorites]);

  return { favorites, isLoading, isFavorited, toggleFavorite, saveFavoriteUpdate, saveSpend };
};

export default useFavorites;
