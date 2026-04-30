import { fetchGooglePlaceDetails } from './googlePlacesService.js';
import restaurantRepository from '../repositories/restaurantRepository.js';
import { priceToSymbol } from '../utils/restaurantFormatter.js';

const FIELD_MASK = 'id,displayName,formattedAddress,location,priceLevel,rating,userRatingCount,types,photos';

/**
 * Ensures a restaurant row exists in the local DB cache with a photo reference.
 *
 * If the restaurant is missing or has no photo (incomplete cache), it fetches
 * the full details from the Google Places API and writes them to the DB.
 * A missing photo_reference is treated as an incomplete cache entry because
 * photo data is the most commonly absent field on partial inserts.
 *
 * @param {string} restaurantId - The Google Places ID of the restaurant.
 * @returns {Promise<void>}
 * @throws {Error} If the Google Places API call or the DB write fails.
 */
export const ensureRestaurantCached = async (restaurantId) => {
  const existing = await restaurantRepository.findById(restaurantId);

  if (existing.length && existing[0].photo_reference) return;

  const apiKey = process.env.PLACES_API_KEY;
  const p = await fetchGooglePlaceDetails(restaurantId, apiKey, FIELD_MASK);

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
};
