import React from "react";
import { useSelector } from "react-redux";
import OrderComponent from "../components/orderComponent";

export default function OrderPage() {
  const { currentUser } = useSelector((state) => state.auth);

  if (!currentUser) {
    return (
      <section className="order-flow-hero">
        <div className="order-flow-hero-content">
          <p className="order-flow-eyebrow">Orders</p>
          <h1 className="order-flow-title">Sign in to view your orders</h1>
          <p className="order-flow-text">
            Your account dashboard order history is only available after login.
          </p>
        </div>
      </section>
    );
  }
  return (
    <OrderComponent />
  );
}
