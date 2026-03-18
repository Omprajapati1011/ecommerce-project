import React, { useEffect, useMemo, useRef, useState } from "react";
import { RadioButton } from "primereact/radiobutton";
import { Button } from "primereact/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import OrderSummaryComponent from "./OrderSummaryComponent";
import { Banknote, CreditCard } from "lucide-react";
import { postOrders } from "../redux/slices/orderSlice";
import { useToast } from "../context/ToastContext";
import api from "../../api/api";
import {
  clearPendingCheckout,
  loadPendingCheckout,
  savePendingCheckout,
} from "../utils/checkoutStorage";
import "../styles/CheckoutFlow.css";

const formatPersonName = (value = "") =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const extractErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function OrderPaymentComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const showToast = useToast();
  const cancelHandledRef = useRef(false);
  const persistedCheckout = useMemo(() => loadPendingCheckout(), []);
  const selectedAddress =
    location.state?.selectedAddress || persistedCheckout?.selectedAddress;

  const [selectPaymentMode, setSelectPaymentMode] = useState("COD");
  const [submitting, setSubmitting] = useState(false);

  const paymentModes = [
    {
      id: 1,
      name: "Cash On Delivery",
      value: "COD",
      description: "Pay when your order is delivered",
    },
    {
      id: 2,
      name: "Online Payment",
      value: "ONLINE",
      description: "Pay securely with Stripe checkout",
    },
  ];

  useEffect(() => {
    if (!selectedAddress) {
      navigate("/checkout/address", { replace: true });
    }
  }, [navigate, selectedAddress]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isCancelled = params.get("stripe_cancelled") === "1";

    if (!isCancelled || cancelHandledRef.current) {
      return;
    }

    cancelHandledRef.current = true;

    const rollbackCheckout = async () => {
      const pendingCheckout = loadPendingCheckout();
      const sessionId = pendingCheckout?.stripeSessionId;

      if (!sessionId) {
        return;
      }

      try {
        await api.post("/payments/stripe/cancel", { session_id: sessionId });
        showToast(
          "warn",
          "Stripe Cancelled",
          "Online payment was cancelled. You can try again or choose COD.",
        );
      } catch (error) {
        showToast(
          "error",
          "Cancellation Failed",
          extractErrorMessage(
            error,
            "Unable to roll back the cancelled Stripe checkout.",
          ),
        );
      } finally {
        savePendingCheckout({ selectedAddress: pendingCheckout?.selectedAddress });
        navigate("/checkout/payment", {
          replace: true,
          state: { selectedAddress: pendingCheckout?.selectedAddress },
        });
      }
    };

    rollbackCheckout();
  }, [location.search, navigate, selectedAddress, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAddress) {
      showToast("warn", "Address Required", "Please choose a delivery address.");
      return;
    }

    if (selectPaymentMode === "COD") {
      savePendingCheckout({ selectedAddress });
      navigate("/checkout/beforeorderconfirm", {
        state: { selectedAddress },
      });
      return;
    }

    let createdOrder = null;

    try {
      setSubmitting(true);

      const createOrderResult = await dispatch(
        postOrders({ payment_method: "stripe" }),
      );

      if (createOrderResult.meta.requestStatus !== "fulfilled") {
        throw new Error("Unable to create order for online payment.");
      }

      createdOrder = createOrderResult.payload;
      const orderId = createdOrder?.order_id || createdOrder?.insertId;

      if (!orderId) {
        throw new Error("Order was created without a valid order id.");
      }

      const totalAmount = Number(createdOrder?.total_amount) || 0;
      if (totalAmount <= 0) {
        throw new Error("Order total is invalid for payment.");
      }

      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;
      const cancelUrl = `${baseUrl}/checkout/payment?stripe_cancelled=1&order_id=${orderId}`;

      const paymentResponse = await api.post("/payments/initiate", {
        order_id: orderId,
        amount: totalAmount,
        payment_method: "stripe",
        currency: "INR",
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      const paymentData = paymentResponse?.data?.data || {};
      if (!paymentData.checkout_url || !paymentData.stripe_session_id) {
        throw new Error("Stripe checkout session could not be created.");
      }

      savePendingCheckout({
        selectedAddress,
        orderData: {
          ...createdOrder,
          order_id: orderId,
          total_amount: totalAmount,
          payment_method: "stripe",
          payment_status: "processing",
        },
        stripeSessionId: paymentData.stripe_session_id,
      });

      window.location.assign(paymentData.checkout_url);
    } catch (error) {
      if (createdOrder?.order_id || createdOrder?.insertId) {
        try {
          await api.delete(
            `/order/cancelorder/${createdOrder.order_id || createdOrder.insertId}`,
          );
        } catch {
          // ignore rollback failure; original error is more useful to surface
        }
      }

      clearPendingCheckout();
      showToast(
        "error",
        "Payment Start Failed",
        extractErrorMessage(
          error,
          "Unable to start Stripe checkout. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="order-flow-shell">
      <section className="order-flow-hero">
        <div className="order-flow-hero-content">
          <p className="order-flow-eyebrow">Step 2 of 3</p>
          <h2 className="order-flow-title">Choose Payment Mode</h2>
          <p className="order-flow-text">
            Select how you want to pay for this order.
          </p>
        </div>
      </section>

      <div className="order-flow-grid">
        <div>
          <form onSubmit={handleSubmit} className="order-flow-card">
            <div className="mb-5">
              <h3 className="order-flow-section-title">Payment Options</h3>
              <p className="order-flow-section-copy">
                Use Stripe for secure online payment, or choose cash on
                delivery if you prefer to pay at your doorstep.
              </p>
            </div>

            <div>
              {paymentModes.map((mode) => {
                const isSelected = selectPaymentMode === mode.value;
                const Icon = mode.value === "COD" ? Banknote : CreditCard;

                return (
                  <div
                    key={mode.id}
                    className={`mb-3 ${isSelected ? "order-flow-option order-flow-option-active" : "order-flow-option"}`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioButton
                        inputId={`payment-${mode.id}`}
                        name="payment"
                        value={mode.value}
                        onChange={() => setSelectPaymentMode(mode.value)}
                        checked={isSelected}
                      />
                      <label
                        htmlFor={`payment-${mode.id}`}
                        className="w-full cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                              <Icon className="h-5 w-5" />
                            </span>
                            <h3 className="m-0 font-semibold text-gray-900 dark:text-slate-100">
                              {mode.name}
                            </h3>
                          </div>
                        </div>
                        <p className="m-0 mt-2 text-sm text-gray-500 dark:text-slate-400">
                          {mode.description}
                        </p>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                label="Back to Address"
                icon="pi pi-arrow-left"
                outlined
                onClick={() =>
                  navigate("/checkout/address", { state: { selectedAddress } })
                }
                className="order-flow-secondary-button"
                disabled={submitting}
              />
              <Button
                type="submit"
                label={
                  selectPaymentMode === "ONLINE"
                    ? "Continue to Stripe"
                    : "Continue to Confirmation"
                }
                icon="pi pi-arrow-right"
                iconPos="right"
                className="order-flow-primary-button"
                loading={submitting}
                disabled={submitting}
              />
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <OrderSummaryComponent title="Payable Summary" />
          {selectedAddress && (
            <div className="order-flow-card-muted">
              <p className="font-accent text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">
                Delivering To
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                {formatPersonName(selectedAddress.full_name)},{" "}
                {selectedAddress.phone}
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-300">
                {selectedAddress.address_line1}
                {selectedAddress.address_line2
                  ? `, ${selectedAddress.address_line2}`
                  : ""}
                {` ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.postal_code}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
