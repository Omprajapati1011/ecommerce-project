import getApiErrorMessage from "../../../utils/apiError";

const phonePattern = /^[6-9]\d{9}$/;
const cityStatePattern = /^[a-zA-Z\s]+$/;
const postalCodePattern = /^[0-9A-Za-z\s-]{4,10}$/;

export const toArray = (value) => (Array.isArray(value) ? value : []);

export const extractData = (response) => response?.data?.data ?? null;

export const extractErrorMessage = (apiError, fallback) => {
  return getApiErrorMessage(apiError, fallback);
};

export const extractValidationErrorMessage = (apiError) => {
  const backendErrors = apiError?.response?.data?.errors;

  if (!Array.isArray(backendErrors) || backendErrors.length === 0) {
    return "";
  }

  return backendErrors
    .map((issue) => {
      const field = Array.isArray(issue.path)
        ? issue.path.join(".")
        : issue.field || "";
      const message = issue.message || "Invalid value";
      return field ? `${field}: ${message}` : message;
    })
    .join(" | ");
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export function orderSeverity(status) {
  const normalized = String(status || "").toLowerCase();

  if (["delivered", "completed"].includes(normalized)) {
    return "success";
  }

  if (["cancelled", "failed"].includes(normalized)) {
    return "danger";
  }

  if (["returned", "refunded"].includes(normalized)) {
    return "warning";
  }

  if (["processing", "pending", "shipped"].includes(normalized)) {
    return "info";
  }

  return "secondary";
}

export function paymentSeverity(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "completed") {
    return "success";
  }

  if (["failed", "cancelled"].includes(normalized)) {
    return "danger";
  }

  if (normalized === "refunded") {
    return "warning";
  }

  if (["processing", "pending"].includes(normalized)) {
    return "info";
  }

  return "secondary";
}

export function displayPaymentStatus(orderOrStatus, maybeOrder = null) {
  const order =
    maybeOrder === null &&
    typeof orderOrStatus === "object" &&
    orderOrStatus !== null
      ? orderOrStatus
      : maybeOrder;

  const rawStatus =
    maybeOrder === null &&
    typeof orderOrStatus === "object" &&
    orderOrStatus !== null
      ? orderOrStatus?.payment_status
      : orderOrStatus;

  const orderStatus = String(order?.order_status || "").toLowerCase();
  if (orderStatus === "cancelled") {
    return "N/A";
  }

  return String(rawStatus || "unknown");
}

export const buildAddressFormState = (address = null) => ({
  full_name: address?.full_name || "",
  phone: address?.phone || "",
  address_line1: address?.address_line1 || "",
  address_line2: address?.address_line2 || "",
  city: address?.city || "",
  state: address?.state || "",
  postal_code: address?.postal_code || "",
  country: address?.country || "India",
  is_default: Number(address?.is_default) === 1,
});

export const validateAddressFields = (formValues) => {
  if (
    !formValues.full_name.trim() ||
    !formValues.phone.trim() ||
    !formValues.address_line1.trim() ||
    !formValues.city.trim() ||
    !formValues.state.trim() ||
    !formValues.postal_code.trim()
  ) {
    return "Please fill all required address fields.";
  }

  if (!phonePattern.test(formValues.phone.trim())) {
    return "Phone must be a valid 10-digit Indian mobile number.";
  }

  if (!cityStatePattern.test(formValues.city.trim())) {
    return "City must contain only letters.";
  }

  if (!cityStatePattern.test(formValues.state.trim())) {
    return "State must contain only letters.";
  }

  if (!postalCodePattern.test(formValues.postal_code.trim())) {
    return "Postal code format is invalid.";
  }

  return "";
};

export const buildAddressPayload = (formValues) => ({
  full_name: formValues.full_name.trim(),
  phone: formValues.phone.trim(),
  address_line1: formValues.address_line1.trim(),
  address_line2: formValues.address_line2.trim() || undefined,
  city: formValues.city.trim(),
  state: formValues.state.trim(),
  postal_code: formValues.postal_code.trim(),
  country: formValues.country.trim() || "India",
});
