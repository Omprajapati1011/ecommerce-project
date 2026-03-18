import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { OrderSummery, postOrders } from "../redux/slices/orderSlice";
import api from "../../api/api";
import OrderSummaryComponent from "./OrderSummaryComponent";
import { ClipboardList, Wallet } from "lucide-react";
import { useToast } from "../context/ToastContext";
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

const toRupee = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function OrderConfirmationCODComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const showToast = useToast();

  const [showItemsDialog, setShowItemsDialog] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartItemsLoading, setCartItemsLoading] = useState(false);
  const [cartItemsError, setCartItemsError] = useState("");
  const [cartSummary, setCartSummary] = useState(null);
  const pendingCheckout = loadPendingCheckout();

  const selectedAddress =
    location.state?.selectedAddress || pendingCheckout?.selectedAddress;
  const { orderSummery, loading } = useSelector((state) => state.order || {});

  useEffect(() => {
    dispatch(OrderSummery());

    const fetchCartItems = async () => {
      try {
        setCartItemsLoading(true);
        setCartItemsError("");
        const res = await api.get("/cart");
        const cartData = res?.data?.data || {};
        setCartItems(Array.isArray(cartData.items) ? cartData.items : []);
        setCartSummary(cartData);
      } catch (err) {
        setCartItemsError(
          err?.response?.data?.message || "Unable to load cart items.",
        );
        setCartSummary(null);
      } finally {
        setCartItemsLoading(false);
      }
    };

    fetchCartItems();
  }, [dispatch]);

  const handlePlaceOrder = async () => {
    if (cartItemsLoading) {
      return;
    }

    if (!selectedAddress) {
      showToast("warn", "Address Required", "Please select a delivery address.");
      navigate("/checkout/address");
      return;
    }

    if (!cartItems.length) {
      showToast("warn", "Empty Cart", "Your cart is empty. Add items first.");
      navigate("/cart");
      return;
    }

    const result = await dispatch(
      postOrders({ payment_method: "cash_on_delivery" }),
    );

    if (result.meta.requestStatus !== "fulfilled") {
      showToast("error", "Order Failed", "Unable to place the order.");
      return;
    }

    const orderData = result.payload;
    const orderId = orderData?.order_id || orderData?.insertId;
    const orderTotal =
      Number(orderData?.total_amount) ||
      Number(cartSummary?.total) ||
      Number(orderSummery?.final_amount) ||
      0;

    try {
      await api.post("/payments/initiate", {
        order_id: orderId,
        amount: orderTotal,
        payment_method: "cash_on_delivery",
        currency: "INR",
      });

      clearPendingCheckout();
      window.dispatchEvent(new CustomEvent("cart:updated"));
      navigate("/checkout/success", {
        state: {
          orderData: {
            ...orderData,
            order_id: orderId,
            total_amount: orderTotal,
            payment_method: "cash_on_delivery",
            payment_status: "pending",
          },
          selectedAddress,
        },
      });
    } catch (error) {
      try {
        await api.delete(`/order/cancelorder/${orderId}`);
      } catch {
        // no-op rollback fallback
      }

      savePendingCheckout({ selectedAddress });
      showToast(
        "error",
        "Payment Setup Failed",
        error?.response?.data?.message ||
          "Order was created but COD payment setup failed, so it was rolled back.",
      );
    }
  };

  return (
    <div className="order-flow-shell">
      <section className="order-flow-hero">
        <div className="order-flow-hero-content">
          <p className="order-flow-eyebrow">Step 3 of 3</p>
          <h2 className="order-flow-title">Confirm COD Order</h2>
          <p className="order-flow-text">
            Review items, delivery details, and totals before placing your
            order.
          </p>
        </div>
      </section>

      <div className="order-flow-grid">
        <Card
          className="order-flow-card"
          pt={{ body: { className: "p-0" }, content: { className: "p-0" } }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="order-flow-badge">Cash On Delivery</span>
              <h3 className="order-flow-section-title mt-4">
                Payment on Delivery
              </h3>
              <p className="order-flow-section-copy">
                Keep exact change ready for quick handover when the order
                arrives.
              </p>
            </div>
            <div className="order-flow-card-muted flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <p className="order-flow-stat-label">Payment Mode</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  Cash on Delivery
                </p>
              </div>
            </div>
          </div>

          {selectedAddress && (
            <div className="order-flow-card-muted mt-5">
              <p className="font-accent text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">
                Deliver To
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
                {`, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.postal_code}`}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              label="Back to Payment"
              icon="pi pi-arrow-left"
              onClick={() =>
                navigate("/checkout/payment", { state: { selectedAddress } })
              }
              className="order-flow-neutral-button"
            />
            <Button
              label={`View Items (${cartItems.length})`}
              icon="pi pi-list"
              onClick={() => setShowItemsDialog(true)}
              className="order-flow-neutral-button"
              disabled={cartItemsLoading}
            />
          </div>

          <Divider />

          <div className="flex justify-end">
            <Button
              label={loading ? "Placing..." : "Place Order"}
              icon="pi pi-check"
              onClick={handlePlaceOrder}
              loading={loading}
              disabled={loading || cartItemsLoading || !cartItems.length}
              className="order-flow-primary-button"
            />
          </div>
        </Card>

        <div className="space-y-4">
          <OrderSummaryComponent
            title="Final Amount"
            orderData={{
              total_amount: cartSummary?.subtotal ?? orderSummery?.total_price ?? 0,
              tax_amount: cartSummary?.tax ?? orderSummery?.tax ?? 0,
              discount_amount: cartSummary?.discount ?? orderSummery?.discount ?? 0,
              shipping_amount: 0,
              final_amount: cartSummary?.total ?? orderSummery?.final_amount ?? 0,
            }}
          />
        </div>
      </div>

      <Dialog
        header="Items Going To This Order"
        visible={showItemsDialog}
        style={{ width: "min(760px, 95vw)" }}
        breakpoints={{ "960px": "95vw", "640px": "100vw" }}
        onHide={() => setShowItemsDialog(false)}
      >
        {cartItemsLoading && (
          <div className="order-flow-empty">Loading items...</div>
        )}
        {!cartItemsLoading && cartItemsError && (
          <div className="order-flow-alert border-red-300/70 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {cartItemsError}
          </div>
        )}
        {!cartItemsLoading && !cartItemsError && cartItems.length === 0 && (
          <div className="order-flow-empty">No items found in cart.</div>
        )}

        {!cartItemsLoading && !cartItemsError && cartItems.length > 0 && (
          <div className="flex flex-col gap-3">
            {cartItems.map((item) => (
              <div
                key={item.cartItemId}
                className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-[#1f2933] dark:bg-[#10171b]"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.productName || "Product"}
                      className="h-16 w-16 rounded-2xl border border-amber-200/70 object-cover dark:border-[#1f2933]"
                    />
                  ) : (
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <ClipboardList className="h-6 w-6" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-slate-100">
                      {item.productName || "Product"}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                      Qty: {item.quantity}
                      {item.portionValue
                        ? ` | Portion: ${item.portionValue}`
                        : ""}
                      {item.modifierValue
                        ? ` | Modifier: ${item.modifierValue}`
                        : ""}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 font-semibold text-gray-900 dark:text-slate-100">
                  {toRupee(item.discountedLineTotal ?? item.lineTotal ?? 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}
