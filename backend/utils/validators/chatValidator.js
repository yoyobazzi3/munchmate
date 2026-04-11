/**
 * Validates a chat message payload.
 * @param {string} message - The message text to validate.
 * @returns {Object} An object with `isValid` boolean and an optional `error` message string.
 */
export const validateChatMessage = (message) => {
  if (!message) {
    return { isValid: false, error: "Message is required" };
  }
  if (message.length > 500) {
    return { isValid: false, error: "Message must be 500 characters or fewer" };
  }
  return { isValid: true };
};
