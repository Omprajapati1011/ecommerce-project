function collectMessages(value) {
  if (!value) return [];

  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectMessages(item));
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap((item) => collectMessages(item));
  }

  return [];
}

/**
 * Translate backend/system wording into copy a non-technical person can act on.
 * We keep this centralized so admin and customer screens stay consistent.
 */
function normalizeTechnicalMessage(message) {
  if (typeof message !== "string") return "";

  const trimmed = message.trim();
  if (!trimmed) return "";

  const normalized = trimmed.toLowerCase();

  const exactMap = new Map([
    ["server error", "Something went wrong on our side. Please try again."],
    ["internal server error", "Something went wrong on our side. Please try again."],
    ["invalid or missing status", "Please choose a valid status and try again."],
    ["invalid status", "Please choose a valid status and try again."],
    ["invalid status transition", "This order cannot be moved to that status yet."],
    ["invalid or missing payment status", "Please choose a valid payment status and try again."],
    ["invalid payment status", "Please choose a valid payment status and try again."],
    ["invalid payment status transition", "This payment cannot be moved to that status yet."],
    ["stripe payments are gateway-managed and cannot be updated by admin", "Stripe payment updates are handled automatically, so this status is view-only."],
    ["cart is empty", "Your cart is empty. Add an item before continuing."],
    ["invalid or expired otp token", "Your verification code has expired. Please request a new one."],
    ["invalid otp", "The verification code is incorrect. Please try again."],
    ["invalid otp request", "This verification request is no longer valid. Please start again."],
    ["invalid otp purpose", "This verification request is no longer valid. Please start again."],
    ["invalid refresh token", "Your session has expired. Please log in again."],
    ["invalid or expired refresh token", "Your session has expired. Please log in again."],
    ["invalid or expired token", "Your session has expired. Please log in again."],
    ["no token", "Please log in to continue."],
    ["invalid password", "The email or password you entered is incorrect."],
    ["user not found", "We could not find an account with those details."],
    ["all fields are required", "Please fill in all required fields."],
    ["new password and confirm password do not match", "The new password and confirmation do not match."],
    ["new password cannot be same as old password", "Please choose a new password that is different from your current one."],
    ["smtp is not configured", "Email service is not available right now. Please try again later."],
  ]);

  if (exactMap.has(normalized)) {
    return exactMap.get(normalized);
  }

  if (normalized.includes("not authorized")) {
    return "You do not have permission to do that.";
  }

  if (normalized.includes("cannot be cancelled")) {
    return "This order can no longer be cancelled.";
  }

  if (normalized.includes("cancellation-requested")) {
    return "This order cannot accept a cancellation request right now.";
  }

  if (normalized.includes("payment verification failed")) {
    return "We could not confirm the payment yet. Please wait a moment and check again.";
  }

  if (normalized.includes("invalid payment method")) {
    return "Please choose a valid payment method.";
  }

  if (normalized.includes("order total is invalid")) {
    return "We could not confirm your order total. Please refresh and try again.";
  }

  if (normalized.includes("unable to create order for online payment")) {
    return "We could not start online payment right now. Please try again.";
  }

  return trimmed;
}

function getStatusFallback(status) {
  switch (status) {
    case 400:
      return "The request was invalid. Please check the submitted data.";
    case 401:
      return "Your session has expired or authentication failed. Please log in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "This action conflicts with existing data.";
    case 422:
      return "Some fields are invalid. Please review the form and try again.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    default:
      return status >= 500
        ? "Something went wrong on the server. Please try again."
        : null;
  }
}

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;

  if (error.code === "ECONNABORTED") {
    return "The request took too long. Please try again.";
  }

  const response = error.response;
  const data = response?.data;

  const directMessage =
    data?.message ||
    data?.error ||
    data?.details?.message ||
    data?.data?.message;

  if (typeof directMessage === "string" && directMessage.trim()) {
    return normalizeTechnicalMessage(directMessage);
  }

  const collected = [
    ...collectMessages(data?.errors),
    ...collectMessages(data?.details?.errors),
    ...collectMessages(data?.data?.errors),
  ].filter(Boolean);

  if (collected.length > 0) {
    return normalizeTechnicalMessage(collected.join(" "));
  }

  if (!response) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return "You appear to be offline. Please check your internet connection.";
    }

    if (error.message === "Network Error") {
      return "Unable to reach the server. Please check your connection and backend URL.";
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return normalizeTechnicalMessage(error.message);
    }

    return fallback;
  }

  return getStatusFallback(response.status) || fallback;
}

export default getApiErrorMessage;
