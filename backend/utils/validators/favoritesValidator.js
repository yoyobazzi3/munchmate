const VALID_STATUSES = ['want_to_go', 'visited'];

/**
 * Validates the fields allowed when updating a favorite restaurant entry.
 *
 * @param {{ status?: string, rating?: number }} fields
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validateFavoriteUpdate = ({ status, rating }) => {
  if (status && !VALID_STATUSES.includes(status)) {
    return { isValid: false, error: 'Invalid status value' };
  }
  if (rating !== undefined && rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return { isValid: false, error: 'Rating must be an integer between 1 and 5' };
  }
  return { isValid: true };
};

/**
 * Validates a spend amount before logging it against a favorite.
 *
 * @param {*} amount - The raw value from req.body.
 * @returns {{ isValid: boolean, parsed?: number, error?: string }}
 */
export const validateSpendAmount = (amount) => {
  const parsed = parseFloat(amount);
  if (amount === undefined || amount === null || isNaN(parsed) || parsed < 0) {
    return { isValid: false, error: 'amount must be a non-negative number' };
  }
  return { isValid: true, parsed };
};
