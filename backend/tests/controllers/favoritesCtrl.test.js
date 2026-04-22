import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/favoritesRepository.js', () => ({
  default: {
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    updateFavorite: vi.fn(),
    getFavorites: vi.fn(),
    updateSpend: vi.fn(),
    getSpendLogs: vi.fn(),
    getVisitedWithSpend: vi.fn(),
    getRatedFavorites: vi.fn(),
  },
}));

vi.mock('../../repositories/restaurantRepository.js', () => ({
  default: {
    findById: vi.fn(),
    cacheRestaurant: vi.fn(),
  },
}));

vi.mock('../../services/googlePlacesService.js', () => ({
  fetchGooglePlaceDetails: vi.fn(),
}));

vi.mock('../../utils/restaurantFormatter.js', () => ({
  priceToSymbol: vi.fn(() => '$$'),
}));

import favoritesCtrl from '../../controllers/favoritesCtrl.js';
import favoritesRepository from '../../repositories/favoritesRepository.js';
import restaurantRepository from '../../repositories/restaurantRepository.js';
import { fetchGooglePlaceDetails } from '../../services/googlePlacesService.js';

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  user: { userId: 1 },
  body: {},
  params: {},
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── addFavorite ───────────────────────────────────────────────────────────────

describe('favoritesCtrl.addFavorite', () => {
  it('returns 400 when restaurant_id is missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await favoritesCtrl.addFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(favoritesRepository.addFavorite).not.toHaveBeenCalled();
  });

  it('adds favorite using cached restaurant data when it exists', async () => {
    restaurantRepository.findById.mockResolvedValue([{ id: 'place1', photo_reference: 'photo123' }]);
    favoritesRepository.addFavorite.mockResolvedValue();

    const req = mockReq({ body: { restaurant_id: 'place1' } });
    const res = mockRes();

    await favoritesCtrl.addFavorite(req, res);

    expect(fetchGooglePlaceDetails).not.toHaveBeenCalled();
    expect(favoritesRepository.addFavorite).toHaveBeenCalledWith(1, 'place1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('fetches and caches restaurant from Google when not yet cached', async () => {
    restaurantRepository.findById.mockResolvedValue([]);
    fetchGooglePlaceDetails.mockResolvedValue({
      id: 'place2',
      displayName: { text: 'New Place' },
      formattedAddress: '123 Main St',
      location: { latitude: 37.7, longitude: -122.4 },
      priceLevel: 2,
      rating: 4.5,
      userRatingCount: 100,
      types: ['restaurant'],
      photos: [{ name: 'photo_ref' }],
    });
    favoritesRepository.addFavorite.mockResolvedValue();

    const req = mockReq({ body: { restaurant_id: 'place2' } });
    const res = mockRes();

    await favoritesCtrl.addFavorite(req, res);

    expect(fetchGooglePlaceDetails).toHaveBeenCalledOnce();
    expect(fetchGooglePlaceDetails.mock.calls[0][0]).toBe('place2');
    expect(restaurantRepository.cacheRestaurant).toHaveBeenCalled();
    expect(favoritesRepository.addFavorite).toHaveBeenCalledWith(1, 'place2');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when repository throws', async () => {
    restaurantRepository.findById.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ body: { restaurant_id: 'place1' } });
    const res = mockRes();

    await favoritesCtrl.addFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── removeFavorite ────────────────────────────────────────────────────────────

describe('favoritesCtrl.removeFavorite', () => {
  it('removes favorite and returns 200', async () => {
    favoritesRepository.removeFavorite.mockResolvedValue();

    const req = mockReq({ params: { restaurantId: 'place1' } });
    const res = mockRes();

    await favoritesCtrl.removeFavorite(req, res);

    expect(favoritesRepository.removeFavorite).toHaveBeenCalledWith(1, 'place1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when removal throws', async () => {
    favoritesRepository.removeFavorite.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ params: { restaurantId: 'place1' } });
    const res = mockRes();

    await favoritesCtrl.removeFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── updateFavorite ────────────────────────────────────────────────────────────

describe('favoritesCtrl.updateFavorite', () => {
  it('returns 400 for invalid status value', async () => {
    const req = mockReq({ params: { restaurantId: 'place1' }, body: { status: 'invalid_status' } });
    const res = mockRes();

    await favoritesCtrl.updateFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(favoritesRepository.updateFavorite).not.toHaveBeenCalled();
  });

  it('returns 400 for rating out of range', async () => {
    const req = mockReq({ params: { restaurantId: 'place1' }, body: { rating: 6 } });
    const res = mockRes();

    await favoritesCtrl.updateFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for non-integer rating', async () => {
    const req = mockReq({ params: { restaurantId: 'place1' }, body: { rating: 3.5 } });
    const res = mockRes();

    await favoritesCtrl.updateFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates favorite and returns 200 for valid input', async () => {
    favoritesRepository.updateFavorite.mockResolvedValue();

    const req = mockReq({ params: { restaurantId: 'place1' }, body: { status: 'visited', rating: 4, note: 'Great food' } });
    const res = mockRes();

    await favoritesCtrl.updateFavorite(req, res);

    expect(favoritesRepository.updateFavorite).toHaveBeenCalledWith(1, 'place1', { note: 'Great food', status: 'visited', rating: 4 });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── updateSpend ───────────────────────────────────────────────────────────────

describe('favoritesCtrl.updateSpend', () => {
  it('returns 400 for missing amount', async () => {
    const req = mockReq({ params: { restaurantId: 'place1' }, body: {} });
    const res = mockRes();

    await favoritesCtrl.updateSpend(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for negative amount', async () => {
    const req = mockReq({ params: { restaurantId: 'place1' }, body: { amount: -5 } });
    const res = mockRes();

    await favoritesCtrl.updateSpend(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for non-numeric amount', async () => {
    const req = mockReq({ params: { restaurantId: 'place1' }, body: { amount: 'abc' } });
    const res = mockRes();

    await favoritesCtrl.updateSpend(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('logs spend and returns 200 for valid amount', async () => {
    favoritesRepository.updateSpend.mockResolvedValue();

    const req = mockReq({ params: { restaurantId: 'place1' }, body: { amount: 42.5 } });
    const res = mockRes();

    await favoritesCtrl.updateSpend(req, res);

    expect(favoritesRepository.updateSpend).toHaveBeenCalledWith(1, 'place1', 42.5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('logs spend of 0 (valid edge case)', async () => {
    favoritesRepository.updateSpend.mockResolvedValue();

    const req = mockReq({ params: { restaurantId: 'place1' }, body: { amount: 0 } });
    const res = mockRes();

    await favoritesCtrl.updateSpend(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
