/**
 * Selects a specified number of randomly distributed elements from an array.
 * 
 * @param {Array} arr - The source array to sample from.
 * @param {number} n - The number of distinct random items to return.
 * @returns {Array} A new array containing only the randomly selected items.
 */
export const pickRandom = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};
