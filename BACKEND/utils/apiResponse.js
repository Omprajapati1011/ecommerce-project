/**
 * Standardized API Response Helper
 * Ensures every endpoint returns a consistent JSON structure:
 * { success: boolean, message: string, data?: any }
 *
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (200, 201, 400, 401, 404, 500, etc.)
 * @param {string} message - Human-readable response message
 * @param {any} data - Optional payload (object, array, etc.)
 */
export const sendResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};
