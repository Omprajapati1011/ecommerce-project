import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { findOrderItems } from "../redux/slices/orderSlice";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { useLocation } from "react-router-dom";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import OrderSummaryComponent from "./OrderSummaryComponent";

export default function AfterOrderSummeryComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state?.data;
  const { id } = useParams();
  const { loading,orderSummery } = useSelector(
    (state) => state.order || {},
  );
  
  // Fallback: if data is missing from navigation state, try to find it in the orders list
  const orderData =
    data || orders.find((o) => String(o.order_id) === String(id));


  useEffect(() => {
    dispatch(findOrderItems({ id, page: 1, limit: 5 }));
  }, [id, dispatch]);

  if (!orderData && !loading) {
    return (
      <div className="p-4 text-center">
        <p>Order data not found. Please go back to the orders list.</p>
        <Button
          label="Back to Orders"
          onClick={() => navigate("/dashboard/orders")}
          className="mt-4"
        />
      </div>
    );
  }

  return (
    <div className="orders-page-wrapper animate-fade-in">
    
    </div>
  );
}
