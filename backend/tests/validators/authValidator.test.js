import { describe, it, expect } from 'vitest';
import { validateSignupParams } from '../../utils/validators/authValidator.js';

describe('validateSignupParams', () => {
  const valid = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'Password1',
  };

  it('returns valid for a complete, strong payload', () => {
    expect(validateSignupParams(valid)).toEqual({ isValid: true });
  });

  it.each(['firstName', 'lastName', 'email', 'password'])(
    'returns invalid when %s is missing',
    (field) => {
      const data = { ...valid, [field]: undefined };
      const result = validateSignupParams(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/required/i);
    }
  );

  it('returns invalid when password is shorter than 8 characters', () => {
    const result = validateSignupParams({ ...valid, password: 'Pass1' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/8 characters/i);
  });

  it('returns invalid when password has no uppercase letter', () => {
    const result = validateSignupParams({ ...valid, password: 'password1' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/uppercase/i);
  });

  it('returns invalid when password has no number', () => {
    const result = validateSignupParams({ ...valid, password: 'Password' });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/number/i);
  });
});
