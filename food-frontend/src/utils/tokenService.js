// Tokens are now stored in HttpOnly cookies managed by the backend.
// This file only handles non-sensitive user info stored in localStorage for UI display.

/** Persists the user object (name, email) for display across page loads. */
export const saveUser = (user) => localStorage.setItem('user', JSON.stringify(user));

/** Retrieves the stored user object, or null if missing/corrupted. */
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

/** Removes the user object from localStorage (call on logout). */
export const clearUser = () => localStorage.removeItem('user');
