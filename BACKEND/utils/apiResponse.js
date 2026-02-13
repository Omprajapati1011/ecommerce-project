/**
 * Standardized API Response Utility
 * Provides consistent JSON response structure across all endpoints
 */

// ============================================================================
// HTTP STATUS CODES (for reference and consistency)
// ============================================================================

export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// ============================================================================
// CORE RESPONSE FUNCTION
// ============================================================================

/**
 * Send standardized API response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable message
 * @param {any} data - Optional payload
 */
export const sendResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    ...(data !== null && { data }),
  };

  return res.status(statusCode).json(response);
};

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

/**
 * 200 OK - Successful request
 */
export const ok = (res, message = "Success", data = null) => {
  return sendResponse(res, HTTP_STATUS.OK, message, data);
};

/**
 * 201 Created - Resource created successfully
 */
export const created = (res, message = "Created successfully", data = null) => {
  return sendResponse(res, HTTP_STATUS.CREATED, message, data);
};

/**
 * 204 No Content - Success with no response body
 */
export const noContent = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * 400 Bad Request - Invalid request data
 */
export const badRequest = (res, message = "Bad request") => {
  return sendResponse(res, HTTP_STATUS.BAD_REQUEST, message);
};

/**
 * 401 Unauthorized - Authentication required
 */
export const unauthorized = (res, message = "Unauthorized access") => {
  return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, message);
};

/**
 * 403 Forbidden - Insufficient permissions
 */
export const forbidden = (res, message = "Access forbidden") => {
  return sendResponse(res, HTTP_STATUS.FORBIDDEN, message);
};

/**
 * 404 Not Found - Resource doesn't exist
 */
export const notFound = (res, message = "Resource not found") => {
  return sendResponse(res, HTTP_STATUS.NOT_FOUND, message);
};

/**
 * 409 Conflict - Resource already exists
 */
export const conflict = (res, message = "Resource already exists") => {
  return sendResponse(res, HTTP_STATUS.CONFLICT, message);
};

/**
 * 422 Unprocessable Entity - Validation failed
 */
export const validationError = (res, errors, message = "Validation failed") => {
  return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
    success: false,
    message,
    errors, // Array of validation errors
  });
};

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export const tooManyRequests = (
  res,
  message = "Too many requests. Please try again later.",
) => {
  return sendResponse(res, HTTP_STATUS.TOO_MANY_REQUESTS, message);
};

/**
 * 500 Internal Server Error - Server error
 */
export const serverError = (res, message = "Internal server error") => {
  return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
};

// ============================================================================
// PAGINATION RESPONSE
// ============================================================================

/**
 * Paginated response with metadata
 * @param {object} res - Express response object
 * @param {string} message - Response message
 * @param {array} items - Array of items
 * @param {object} pagination - { page, limit, total, totalPages }
 */
export const paginated = (res, message, pagination, items) => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    pagination: {
      currentPage: pagination.page,
      itemsPerPage: pagination.limit,
      totalItems: pagination.total,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1,
    },
    data: items,
  });
};

// ============================================================================
// DEFAULT EXPORT (all functions)
// ============================================================================

export default {
  HTTP_STATUS,
  sendResponse,
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  tooManyRequests,
  serverError,
  paginated,
};
