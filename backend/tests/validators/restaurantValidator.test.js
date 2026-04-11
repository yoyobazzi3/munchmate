import { describe, it, expect } from 'vitest';
import { validateRestaurantQuery } from '../../utils/validators/restaurantValidator.js';

describe('validateRestaurantQuery', () => {
  const withCoords = { latitude: '43.65', longitude: '-79.38' };
  const withLocation = { location: 'Toronto' };

  it('returns valid with coordinates', () => {
    expect(validateRestaurantQuery(withCoords)).toEqual({ isValid: true });
  });

  it('returns valid with a location string', () => {
    expect(validateRestaurantQuery(withLocation)).toEqual({ isValid: true });
  });

  it('returns invalid when neither coords nor location are provided', () => {
    const result = validateRestaurantQuery({});
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/latitude|location/i);
  });

  it('returns invalid for non-numeric coordinates', () => {
    const result = validateRestaurantQuery({ latitude: 'abc', longitude: '-79.38' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/numeric/i);
  });

  it('returns invalid when latitude is out of range', () => {
    const result = validateRestaurantQuery({ latitude: '91', longitude: '0' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/latitude/i);
  });

  it('returns invalid when longitude is out of range', () => {
    const result = validateRestaurantQuery({ latitude: '0', longitude: '181' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/longitude/i);
  });

  it('returns invalid when radius exceeds 50,000', () => {
    const result = validateRestaurantQuery({ ...withCoords, radius: '50001' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/50,000/);
  });

  it('returns invalid for a negative radius', () => {
    const result = validateRestaurantQuery({ ...withCoords, radius: '-100' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/positive/i);
  });

  it('returns invalid for an unrecognized sortBy value', () => {
    const result = validateRestaurantQuery({ ...withCoords, sortBy: 'newest' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/sortBy/i);
  });

  it('returns invalid for an unrecognized diningOption', () => {
    const result = validateRestaurantQuery({ ...withCoords, diningOption: 'drive-thru' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/diningOption/i);
  });

  it('returns invalid for a bad price value', () => {
    const result = validateRestaurantQuery({ ...withCoords, price: '5' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/price/i);
  });

  it('returns valid for comma-separated valid price values', () => {
    expect(validateRestaurantQuery({ ...withCoords, price: '1,2,3' })).toEqual({ isValid: true });
  });

  it('returns valid when price is an empty string (frontend sends price= when unset)', () => {
    expect(validateRestaurantQuery({ ...withCoords, price: '' })).toEqual({ isValid: true });
  });

  it('returns invalid when location string exceeds 200 characters', () => {
    const result = validateRestaurantQuery({ location: 'a'.repeat(201) });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/200/);
  });
});
