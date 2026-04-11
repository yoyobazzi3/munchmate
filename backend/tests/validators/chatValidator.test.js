import { describe, it, expect } from 'vitest';
import { validateChatMessage } from '../../utils/validators/chatValidator.js';

describe('validateChatMessage', () => {
  it('returns valid for a normal message', () => {
    expect(validateChatMessage('What is a good restaurant near me?')).toEqual({ isValid: true });
  });

  it('returns invalid when message is missing', () => {
    const result = validateChatMessage(undefined);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it('returns invalid when message is an empty string', () => {
    const result = validateChatMessage('');
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it('returns invalid when message exceeds 500 characters', () => {
    const result = validateChatMessage('a'.repeat(501));
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/500/);
  });

  it('returns valid for a message exactly 500 characters', () => {
    expect(validateChatMessage('a'.repeat(500))).toEqual({ isValid: true });
  });
});
