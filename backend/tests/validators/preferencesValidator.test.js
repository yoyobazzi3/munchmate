import { describe, it, expect } from 'vitest';
import { validatePreferencesPayload } from '../../utils/validators/preferencesValidator.js';

describe('validatePreferencesPayload', () => {
  it('returns valid for a complete valid payload', () => {
    expect(validatePreferencesPayload({ favoriteCuisines: ['Italian'], preferredPriceRange: '$$' })).toEqual({ isValid: true });
  });

  it('returns valid when both fields are omitted (partial update)', () => {
    expect(validatePreferencesPayload({})).toEqual({ isValid: true });
  });

  it('returns valid for an empty cuisines array', () => {
    expect(validatePreferencesPayload({ favoriteCuisines: [] })).toEqual({ isValid: true });
  });

  it('returns invalid when favoriteCuisines is not an array', () => {
    const result = validatePreferencesPayload({ favoriteCuisines: 'Italian' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/array/i);
  });

  it.each(['$', '$$', '$$$', '$$$$', ''])(
    'returns valid for price range "%s"',
    (preferredPriceRange) => {
      expect(validatePreferencesPayload({ preferredPriceRange })).toEqual({ isValid: true });
    }
  );

  it('returns invalid for an unrecognized price range', () => {
    const result = validatePreferencesPayload({ preferredPriceRange: '$$$$$' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/preferredPriceRange/i);
  });
});
