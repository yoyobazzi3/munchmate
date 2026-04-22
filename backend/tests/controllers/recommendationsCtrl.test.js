import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/restaurantRepository.js', () => ({
  default: {
    getClickHistory: vi.fn(),
  },
}));

vi.mock('../../repositories/userRepository.js', () => ({
  default: {
    getPreferences: vi.fn(),
  },
}));

vi.mock('../../repositories/favoritesRepository.js', () => ({
  default: {
    getRatedFavorites: vi.fn(),
  },
}));

vi.mock('../../services/googlePlacesService.js', () => ({
  fetchGooglePlaces: vi.fn(),
}));

vi.mock('../../utils/cache.js', () => ({
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/restaurantFormatter.js', () => ({
  normalizePlaces: vi.fn((places) => places.map(p => ({ id: p.id, name: p.displayName?.text || '' }))),
  PLACES_URL: 'https://places.googleapis.com/v1/places:searchText',
  PRICE_MAP: { '1': 'PRICE_LEVEL_INEXPENSIVE', '2': 'PRICE_LEVEL_MODERATE', '3': 'PRICE_LEVEL_EXPENSIVE', '4': 'PRICE_LEVEL_VERY_EXPENSIVE' },
}));

import recommendationsCtrl from '../../controllers/recommendationsCtrl.js';
import restaurantRepository from '../../repositories/restaurantRepository.js';
import userRepository from '../../repositories/userRepository.js';
import favoritesRepository from '../../repositories/favoritesRepository.js';
import { fetchGooglePlaces } from '../../services/googlePlacesService.js';
import { getCache } from '../../utils/cache.js';

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockReq = (query = {}) => ({ user: { userId: 1 }, query });

const samplePlaces = [
  { id: 'place1', displayName: { text: 'Pizza Place' }, types: ['pizza'] },
  { id: 'place2', displayName: { text: 'Burger Joint' }, types: ['burger'] },
];

beforeEach(() => {
  vi.clearAllMocks();
  restaurantRepository.getClickHistory.mockResolvedValue([]);
  userRepository.getPreferences.mockResolvedValue([{ favorite_cuisines: '["Italian"]', preferred_price_range: '$$' }]);
  favoritesRepository.getRatedFavorites.mockResolvedValue([]);
  fetchGooglePlaces.mockResolvedValue(samplePlaces);
});

describe('recommendationsCtrl', () => {
  it('returns 400 when lat/lng are missing', async () => {
    const req = mockReq({});
    const res = mockRes();

    await recommendationsCtrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(fetchGooglePlaces).not.toHaveBeenCalled();
  });

  it('returns 400 when only lat is provided', async () => {
    const req = mockReq({ lat: '37.7' });
    const res = mockRes();

    await recommendationsCtrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns cached results without hitting Google Places', async () => {
    const cached = [{ id: 'cached1', name: 'Cached Restaurant' }];
    getCache.mockResolvedValueOnce(cached);

    const req = mockReq({ lat: '37.7', lng: '-122.4' });
    const res = mockRes();

    await recommendationsCtrl(req, res);

    expect(fetchGooglePlaces).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(cached);
  });

  it('fetches recommendations and returns 200 with results', async () => {
    const req = mockReq({ lat: '37.7', lng: '-122.4' });
    const res = mockRes();

    await recommendationsCtrl(req, res);

    expect(fetchGooglePlaces).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.any(Array));
  });

  it('prioritizes top clicked cuisine over saved preferences', async () => {
    restaurantRepository.getClickHistory.mockResolvedValue([
      { id: 'r1', category: 'sushi' },
      { id: 'r2', category: 'sushi' },
      { id: 'r3', category: 'pizza' },
    ]);

    const req = mockReq({ lat: '37.7', lng: '-122.4' });
    const res = mockRes();

    await recommendationsCtrl(req, res);

    const [, body] = fetchGooglePlaces.mock.calls[0];
    expect(body.textQuery).toBe('sushi restaurant');
  });

  it('excludes previously viewed restaurants from results', async () => {
    restaurantRepository.getClickHistory.mockResolvedValue([{ id: 'place1', category: 'pizza' }]);
    fetchGooglePlaces.mockResolvedValue(samplePlaces);

    const req = mockReq({ lat: '37.7', lng: '-122.4' });
    const res = mockRes();

    await recommendationsCtrl(req, res);

    const results = res.json.mock.calls[0][0];
    expect(results.every(r => r.id !== 'place1')).toBe(true);
  });

  it('excludes restaurants matching disliked categories (rating <= 2)', async () => {
    favoritesRepository.getRatedFavorites.mockResolvedValue([
      { rating: 1, category: 'pizza' },
    ]);
    fetchGooglePlaces.mockResolvedValue(samplePlaces);

    const req = mockReq({ lat: '37.7', lng: '-122.4' });
    const res = mockRes();

    await recommendationsCtrl(req, res);

    const results = res.json.mock.calls[0][0];
    expect(results.every(r => r.id !== 'place1')).toBe(true);
  });

  it('returns 500 when Google Places throws', async () => {
    fetchGooglePlaces.mockRejectedValue(new Error('API down'));

    const req = mockReq({ lat: '37.7', lng: '-122.4' });
    const res = mockRes();

    await recommendationsCtrl(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
