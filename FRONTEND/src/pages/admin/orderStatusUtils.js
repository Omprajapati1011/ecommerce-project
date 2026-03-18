const ORDER_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const ORDER_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
  refunded: [],
};

const PAYMENT_TRANSITIONS = {
  pending: ["processing", "completed", "failed", "refunded"],
  processing: ["completed", "failed", "refunded"],
  completed: ["refunded"],
  failed: ["processing", "completed"],
  refunded: [],
};

const ORDER_SEVERITY = {
  pending: "secondary",
  processing: "warning",
  shipped: "info",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
  refunded: "contrast",
};

const PAYMENT_SEVERITY = {
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "danger",
  refunded: "contrast",
};

const TERMINAL_ORDER_STATUSES = new Set(["cancelled", "refunded"]);
const TERMINAL_PAYMENT_STATUSES = new Set(["refunded"]);

export const normalizeStatus = (status) =>
  String(status || "").trim().toLowerCase();

export const getPaymentMethod = (order) =>
  normalizeStatus(
    order?.payment_method ||
      order?.payments?.[0]?.payment_method ||
      order?.paymentMethod,
  );

export const isStripeManagedPayment = (order) =>
  getPaymentMethod(order) === "stripe";

export const getOrderSeverity = (status) =>
  ORDER_SEVERITY[normalizeStatus(status)] || "secondary";

export const getPaymentSeverity = (status) =>
  PAYMENT_SEVERITY[normalizeStatus(status)] || "secondary";

export const getDisplayPaymentStatus = (order) => {
  if (normalizeStatus(order?.order_status) === "cancelled") {
    return "N/A";
  }

  return order?.payment_status || "unknown";
};

export const isPaymentStatusEditable = (order) =>
  normalizeStatus(order?.order_status) !== "cancelled" &&
  !isStripeManagedPayment(order);

export const getOrderStatusOptions = () => ORDER_STATUS_OPTIONS;

export const getPaymentStatusOptions = () => PAYMENT_STATUS_OPTIONS;

export const getAvailableOrderStatuses = (order) => {
  const currentStatus = normalizeStatus(order?.order_status) || "pending";
  const paymentStatus = normalizeStatus(order?.payment_status) || "pending";
  const paymentMethod = getPaymentMethod(order);

  if (TERMINAL_ORDER_STATUSES.has(currentStatus)) {
    return ORDER_STATUS_OPTIONS.filter((option) => option.value === currentStatus);
  }

  return ORDER_STATUS_OPTIONS.filter((option) => {
    const nextStatus = option.value;
    if (nextStatus === currentStatus) return true;

    const allowedTransitions = ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(nextStatus)) return false;

    if (paymentStatus === "refunded") {
      return nextStatus === "refunded";
    }

    if (paymentMethod === "cash_on_delivery") {
      if (nextStatus === "completed" && paymentStatus !== "completed") {
        return false;
      }
      return true;
    }

    if (["delivered", "completed"].includes(nextStatus)) {
      return paymentStatus === "completed";
    }

    return true;
  });
};

export const getAvailablePaymentStatuses = (order) => {
  if (normalizeStatus(order?.order_status) === "cancelled") {
    return [];
  }

  const currentStatus = normalizeStatus(order?.payment_status) || "pending";
  const orderStatus = normalizeStatus(order?.order_status) || "pending";
  const paymentMethod = getPaymentMethod(order);

  if (paymentMethod === "stripe") {
    return PAYMENT_STATUS_OPTIONS.filter((option) => option.value === currentStatus);
  }

  if (
    TERMINAL_PAYMENT_STATUSES.has(currentStatus) ||
    normalizeStatus(orderStatus) === "refunded"
  ) {
    return PAYMENT_STATUS_OPTIONS.filter((option) => option.value === "refunded");
  }

  const baseOptions =
    paymentMethod === "cash_on_delivery"
      ? PAYMENT_STATUS_OPTIONS.filter((option) =>
          ["pending", "completed", "refunded"].includes(option.value),
        )
      : PAYMENT_STATUS_OPTIONS;

  return baseOptions.filter((option) => {
    const nextStatus = option.value;
    if (nextStatus === currentStatus) return true;

    const allowedTransitions = PAYMENT_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(nextStatus)) return false;

    if (nextStatus === "refunded") {
      return ["delivered", "completed", "cancelled", "refunded"].includes(
        orderStatus,
      );
    }

    if (
      paymentMethod === "cash_on_delivery" &&
      nextStatus === "completed" &&
      !["delivered", "completed"].includes(orderStatus)
    ) {
      return false;
    }

    if (currentStatus === "completed") {
      return false;
    }

    return true;
  });
};
