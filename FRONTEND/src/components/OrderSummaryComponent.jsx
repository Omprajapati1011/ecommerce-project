import React, { useEffect } from "react";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { useDispatch, useSelector } from "react-redux";
import { OrderSummery } from "../redux/slices/orderSlice";
import "../styles/CheckoutFlow.css";

const formatINR = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const toNumber = (value) => Number(value) || 0;

export default function OrderSummaryComponent({
  orderData,
  title = "Order Summary",
}) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!orderData) {
      dispatch(OrderSummery());
    }
  }, [dispatch, orderData]);

  const { orderSummery } = useSelector((state) => state.order || {});

  const summary = React.useMemo(() => {
    if (orderData) {
      const subtotal = toNumber(
        orderData.subtotal ?? orderData.total_price ?? orderData.total_amount,
      );
      const tax = toNumber(orderData.tax_amount ?? orderData.tax);
      const discount = toNumber(
        orderData.discount_amount ?? orderData.discount,
      );
      const shipping = toNumber(
        orderData.shipping_amount ?? orderData.shipping,
      );
      const finalAmount =
        orderData.final_amount !== undefined
          ? toNumber(orderData.final_amount)
          : subtotal + tax + shipping - discount;

      return {
        total_price: subtotal,
        tax,
        discount,
        shipping,
        final_amount: finalAmount,
      };
    }

    return {
      total_price: toNumber(orderSummery?.total_price),
      tax: toNumber(orderSummery?.tax),
      discount: toNumber(orderSummery?.discount),
      shipping: toNumber(orderSummery?.shipping),
      final_amount: toNumber(orderSummery?.final_amount),
    };
  }, [orderData, orderSummery]);

  return (
    <Card
      className="order-flow-card"
      pt={{ body: { className: "p-0" }, content: { className: "p-0" } }}
    >
      <h3 className="order-flow-section-title text-[1.35rem]">{title}</h3>
      <p className="order-flow-section-copy mt-1">
        Review the pricing breakdown before you continue.
      </p>
      <Divider />

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
        <span className="font-medium text-gray-900 dark:text-slate-100">
          {formatINR(summary.total_price || 0)}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-slate-400">Tax</span>
        <span className="font-medium text-gray-900 dark:text-slate-100">
          {formatINR(summary.tax || 0)}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-slate-400">Discount</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          - {formatINR(summary.discount || 0)}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-slate-400">Shipping</span>
        <span className="font-medium text-gray-900 dark:text-slate-100">
          {formatINR(summary.shipping || 0)}
        </span>
      </div>

      <Divider />

      <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 dark:bg-[#151e22]">
        <span className="font-accent text-sm font-semibold uppercase tracking-[0.14em] text-gray-700 dark:text-slate-300">
          Total
        </span>
        <span className="font-accent text-xl font-semibold text-gray-900 dark:text-slate-100">
          {formatINR(summary.final_amount || 0)}
        </span>
      </div>
    </Card>
  );
}
