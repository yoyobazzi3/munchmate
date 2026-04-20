import { sendError, sendSuccess } from '../utils/responseHandler.js';
import favoritesRepository from '../repositories/favoritesRepository.js';
import { generateInsightFromRatings } from '../services/aiService.js';

const tasteProfileCtrl = async (req, res) => {
  const userId = req.user.userId;
  try {
    const ratedFavorites = await favoritesRepository.getRatedFavorites(userId);
    const insight = await generateInsightFromRatings(ratedFavorites);
    sendSuccess(res, { insight, ratingCount: ratedFavorites.length });
  } catch (err) {
    console.error('Taste profile error:', err);
    sendError(res, 'Failed to generate taste profile', 500);
  }
};

export default tasteProfileCtrl;
