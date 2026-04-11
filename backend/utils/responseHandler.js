/**
 * Sends a standardized error response back to the client.
 * @param {Object} res - Express response object.
 * @param {string} [error="Internal server error"] - The error message to send.
 * @param {number} [statusCode=500] - The HTTP status code.
 * @returns {Object} The JSON response payload.
 */
export const sendError = (res, error = "Internal server error", statusCode = 500) => {
  return res.status(statusCode).json({ error });
};

/**
 * Sends a standardized success response back to the client.
 * @param {Object} res - Express response object.
 * @param {Object|Array} [data={}] - The payload data to send.
 * @param {number} [statusCode=200] - The HTTP status code.
 * @returns {Object} The JSON response payload.
 */
export const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json(data);
};
