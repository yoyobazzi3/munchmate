import { sendError, sendSuccess } from '../utils/responseHandler.js';
import favoritesRepository from '../repositories/favoritesRepository.js';
import restaurantRepository from '../repositories/restaurantRepository.js';
import { fetchGooglePlaceDetails } from '../services/googlePlacesService.js';
import { priceToSymbol } from '../utils/restaurantFormatter.js';

const favoritesCtrl = {
  addFavorite: async (req, res) => {
    const { restaurant_id } = req.body;
    const userId = req.user.userId;

    if (!restaurant_id) return sendError(res, 'Missing restaurant_id', 400);

    try {
      // Ensure the restaurant is cached before saving as favorite
      const existing = await restaurantRepository.findById(restaurant_id);
      if (!existing.length || !existing[0].photo_reference) {
        const apiKey = process.env.PLACES_API_KEY;
        const FIELD_MASK = 'id,displayName,formattedAddress,location,priceLevel,rating,userRatingCount,types,photos';
        const p = await fetchGooglePlaceDetails(restaurant_id, apiKey, FIELD_MASK);
        await restaurantRepository.cacheRestaurant({
          id: p.id,
          name: p.displayName?.text || '',
          address: p.formattedAddress || '',
          latitude: p.location?.latitude || null,
          longitude: p.location?.longitude || null,
          price: priceToSymbol(p.priceLevel),
          rating: p.rating || 0,
          reviewCount: p.userRatingCount || 0,
          category: p.types?.[0]?.replace(/_/g, ' ') || null,
          photoReference: p.photos?.[0]?.name || null,
        });
      }

      await favoritesRepository.addFavorite(userId, restaurant_id);
      sendSuccess(res, { message: 'Added to favorites' });
    } catch (err) {
      console.error('Error adding favorite:', err);
      sendError(res, 'Failed to add favorite', 500);
    }
  },

  removeFavorite: async (req, res) => {
    const { restaurantId } = req.params;
    const userId = req.user.userId;
    try {
      await favoritesRepository.removeFavorite(userId, restaurantId);
      sendSuccess(res, { message: 'Removed from favorites' });
    } catch (err) {
      console.error('Error removing favorite:', err);
      sendError(res, 'Failed to remove favorite', 500);
    }
  },

  updateFavorite: async (req, res) => {
    const { restaurantId } = req.params;
    const userId = req.user.userId;
    const { note, status } = req.body;

    const validStatuses = ['want_to_go', 'visited'];
    if (status && !validStatuses.includes(status)) {
      return sendError(res, 'Invalid status value', 400);
    }

    try {
      await favoritesRepository.updateFavorite(userId, restaurantId, { note, status });
      sendSuccess(res, { message: 'Favorite updated' });
    } catch (err) {
      console.error('Error updating favorite:', err);
      sendError(res, 'Failed to update favorite', 500);
    }
  },

  getFavorites: async (req, res) => {
    const userId = req.user.userId;
    const backendUrl = process.env.BACKEND_URL || '';
    try {
      const favorites = await favoritesRepository.getFavorites(userId, backendUrl);
      sendSuccess(res, favorites);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      sendError(res, 'Failed to fetch favorites', 500);
    }
  },
};

export default favoritesCtrl;
