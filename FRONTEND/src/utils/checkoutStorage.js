const PENDING_CHECKOUT_KEY = "pending-checkout-session";

export const savePendingCheckout = (payload) => {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
};

export const loadPendingCheckout = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearPendingCheckout = () => {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
};
