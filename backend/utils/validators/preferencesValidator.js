/**
 * Validates the payload provided for updating user preferences.
 * 
 * @param {Object} data - The request body data containing preferences info.
 * @returns {Object} { isValid: true } on success, or { isValid: false, error: string } on failure.
 */
export const validatePreferencesPayload = (data) => {
  const { favoriteCuisines, preferredPriceRange } = data;

  if (favoriteCuisines !== undefined && !Array.isArray(favoriteCuisines)) {
    return { isValid: false, error: "favoriteCuisines must be an array of strings." };
  }

  const validPriceRanges = new Set(["", "$", "$$", "$$$", "$$$$"]);
  if (preferredPriceRange !== undefined && !validPriceRanges.has(preferredPriceRange)) {
    return { isValid: false, error: "preferredPriceRange must be one of: '', '$', '$$', '$$$', '$$$$'." };
  }

  return { isValid: true };
};
