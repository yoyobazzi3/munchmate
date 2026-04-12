// Tokens are now stored in HttpOnly cookies managed by the backend.
// This file only handles non-sensitive user info stored in localStorage for UI display.

/**
 * Rehydrates non-sensitive local profiles to immediately bootstrap app session boundaries implicitly.
 * 
 * @param {Object} user - Serialized authentication metadata identifying the user.
 */
export const saveUser = (user) => localStorage.setItem('user', JSON.stringify(user));

/**
 * Accessor polling local caches mapping current context. Handled gracefully when mismatched.
 * 
 * @returns {Object|null} Deserialized internal bounds or null if unauthorized.
 */
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

/**
 * Mutator removing active UI states independently destroying local contexts.
 */
export const clearUser = () => localStorage.removeItem('user');
