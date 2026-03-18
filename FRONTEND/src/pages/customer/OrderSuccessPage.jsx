import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { CheckCircle2, MapPin, ShoppingBag, Truck } from "lucide-react";
import api from "../../../api/api";
import {
  clearPendingCheckout,
  loadPendingCheckout,
} from "../../utils/checkoutStorage";
import "../../styles/CheckoutFlow.css";

const formatPersonName = (value = "") =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function getExpectedDelivery() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const formatPaymentMethod = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized || normalized === "cod" || normalized === "cash_on_delivery") {
    return "Cash on Delivery";
  }

  if (normalized === "online" || normalized === "stripe") {
    return "Stripe";
  }

  return normalized
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const extractErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const persistedCheckout = useMemo(() => loadPendingCheckout(), []);
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const [verificationLoading, setVerificationLoading] = useState(() =>
    Boolean(query.get("session_id")),
  );
  const [verificationError, setVerificationError] = useState("");
  const [verifiedOrderData, setVerifiedOrderData] = useState(() =>
    location.state?.orderData || persistedCheckout?.orderData || null,
  );

  const selectedAddress =
    location.state?.selectedAddress || persistedCheckout?.selectedAddress;

  useEffect(() => {
    const sessionId = query.get("session_id");

    if (!sessionId) {
      if (!verifiedOrderData && !selectedAddress) {
        navigate("/", { replace: true });
      }
      return;
    }

    let active = true;

    const verifyStripeCheckout = async () => {
      try {
        setVerificationLoading(true);
        setVerificationError("");

        const response = await api.post("/payments/verify", {
          session_id: sessionId,
        });

        if (!active) {
          return;
        }

        const payment = response?.data?.data || {};
        setVerifiedOrderData((prev) => ({
          ...(prev || {}),
          order_id: payment.order_id || prev?.order_id,
          total_amount: Number(payment.amount) || prev?.total_amount || 0,
          payment_method: payment.payment_method || "stripe",
          payment_status: payment.status || "completed",
        }));
        clearPendingCheckout();
      } catch (error) {
        if (!active) {
          return;
        }

        setVerificationError(
          extractErrorMessage(
            error,
            "Unable to verify Stripe payment. Please check your orders.",
          ),
        );
      } finally {
        if (active) {
          setVerificationLoading(false);
        }
      }
    };

    verifyStripeCheckout();

    return () => {
      active = false;
    };
  }, [navigate, query, selectedAddress]);

  if (verificationLoading) {
    return (
      <div className="order-flow-shell">
        <div className="order-flow-card flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
          <ProgressSpinner
            style={{ width: "56px", height: "56px" }}
            strokeWidth="4"
          />
          <div>
            <h2 className="order-flow-section-title">Verifying payment</h2>
            <p className="order-flow-section-copy mt-2">
              Please wait while we confirm your Stripe payment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="order-flow-shell">
        <div className="order-flow-card space-y-4">
          <h2 className="order-flow-section-title">Payment verification failed</h2>
          <p className="order-flow-section-copy">{verificationError}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              label="Go to My Orders"
              icon="pi pi-list"
              onClick={() => navigate("/orders")}
              className="order-flow-primary-button"
            />
            <Button
              label="Back to Checkout"
              icon="pi pi-arrow-left"
              outlined
              onClick={() =>
                navigate("/checkout/payment", {
                  state: { selectedAddress },
                })
              }
              className="order-flow-secondary-button"
            />
          </div>
        </div>
      </div>
    );
  }

  const orderData = verifiedOrderData;
  const orderNumber =
    orderData?.order_number ||
    orderData?.order_id ||
    orderData?.orderId ||
    orderData?.insertId ||
    "--";
  const totalAmount = orderData?.total_amount ?? orderData?.total ?? null;
  const paymentMethod = formatPaymentMethod(
    orderData?.payment_method || orderData?.paymentMode,
  );
  const paymentStatus = String(orderData?.payment_status || "").toLowerCase();
  const amountLabel =
    paymentMethod === "Cash on Delivery" ||
    !paymentStatus ||
    paymentStatus === "pending"
      ? "Amount Payable"
      : "Amount Paid";

  return (
    <div className="order-flow-shell animate-fade-in">
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <div className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-200/50 dark:bg-emerald-500/15 dark:shadow-emerald-900/30">
            <CheckCircle2
              className="h-14 w-14 text-emerald-500 dark:text-emerald-400"
              strokeWidth={1.5}
            />
          </div>
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20 dark:bg-emerald-500/10" />
        </div>

        <p className="order-flow-eyebrow mb-2">Order Confirmed</p>
        <h1 className="order-flow-title mb-3">Yay! Order Placed Successfully</h1>
        <p className="order-flow-text max-w-md">
          We've received your order and it's being processed. You'll get a
          confirmation once it's shipped.
        </p>
      </div>

      <div className="order-flow-grid">
        <div className="space-y-4">
          <div className="order-flow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="order-flow-stat-label mb-1">Order Number</p>
                <p className="font-mono text-lg font-bold text-gray-900 dark:text-slate-100">
                  #{orderNumber}
                </p>
              </div>
              <span className="order-flow-badge">{paymentMethod}</span>
            </div>

            <Divider className="!my-1" />

            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <Truck className="h-5 w-5" />
              </span>
              <div>
                <p className="order-flow-stat-label mb-0.5">Expected Delivery</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  Arrives by {getExpectedDelivery()}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  5-7 business days
                </p>
              </div>
            </div>

            {totalAmount !== null && (
              <>
                <Divider className="!my-1" />
                <div className="flex items-center justify-between">
                  <p className="order-flow-stat-label">{amountLabel}</p>
                  <p className="text-base font-bold text-gray-900 dark:text-slate-100">
                    {formatINR(totalAmount)}
                  </p>
                </div>
              </>
            )}
          </div>

          {selectedAddress && (
            <div className="order-flow-card">
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <MapPin className="h-5 w-5" />
                </span>
                <h3 className="order-flow-section-title">Delivering To</h3>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                {formatPersonName(selectedAddress.full_name)}
                {selectedAddress.phone ? ` · ${selectedAddress.phone}` : ""}
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-slate-300">
                {selectedAddress.address_line1}
                {selectedAddress.address_line2
                  ? `, ${selectedAddress.address_line2}`
                  : ""}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {selectedAddress.city}, {selectedAddress.state} -{" "}
                {selectedAddress.postal_code}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="order-flow-card flex flex-col gap-3">
            <h3 className="order-flow-section-title">What's next?</h3>
            <p className="order-flow-section-copy">
              Track your order or keep shopping while we pack it for you.
            </p>
            <Divider className="!my-1" />
            <Button
              label="View My Orders"
              icon="pi pi-list"
              onClick={() => navigate("/dashboard?tab=orders")}
              className="order-flow-primary-button !w-full !justify-center"
              pt={{ label: { className: "!flex-none" } }}
            />
            <Button
              label="Continue Shopping"
              icon={<ShoppingBag className="mr-2 h-4 w-4" />}
              onClick={() => navigate("/shop")}
              className="order-flow-secondary-button !w-full !justify-center"
              pt={{ label: { className: "!flex-none" } }}
            />
          </div>

          <div className="order-flow-card-muted">
            <p className="order-flow-stat-label mb-2">Need help?</p>
            <p className="text-xs leading-5 text-gray-500 dark:text-slate-400">
              You can cancel or check the status of your order any time from the
              <strong className="text-[#2f7a6f] dark:text-[#5eada3]">
                {" "}
                Orders{" "}
              </strong>
              section in your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
