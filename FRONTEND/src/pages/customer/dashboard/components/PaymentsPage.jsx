import { useCallback, useEffect, useState } from "react";
import api from "../../../../../api/api";
import { fetchAllUserOrders } from "../orderData";
import PaymentDetailsModal from "./PaymentDetailsModal";
import PaymentsTable from "./PaymentsTable";

const toArray = (value) => (Array.isArray(value) ? value : []);
const extractData = (response) => response?.data?.data ?? null;

const extractErrorMessage = (apiError, fallback) => {
  const responseData = apiError?.response?.data;
  if (typeof responseData === "string" && responseData.trim()) return responseData;
  if (responseData?.message) return responseData.message;
  if (apiError?.message) return apiError.message;
  return fallback;
};

function PaymentsPage({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const orders = toArray(await fetchAllUserOrders(api));

      if (orders.length === 0) {
        setPayments([]);
        return;
      }

      const paymentGroups = await Promise.all(
        orders.map(async (order) => {
          try {
            const res = await api.get(`/payments/order/${order.order_id}`);
            const records = toArray(extractData(res)).map((payment) => ({
              ...payment,
              order_number: order.order_number || `#${order.order_id}`,
            }));
            return records;
          } catch {
            return [];
          }
        }),
      );

      const flatPayments = paymentGroups.flat();
      const sorted = [...flatPayments].sort((a, b) => {
        const aDate = new Date(a?.created_at || 0).getTime();
        const bDate = new Date(b?.created_at || 0).getTime();
        if (aDate !== bDate) return bDate - aDate;
        return Number(b?.payment_id || 0) - Number(a?.payment_id || 0);
      });

      setPayments(sorted);
    } catch (apiError) {
      setError(extractErrorMessage(apiError, "Failed to load payment history."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (!error) {
      return;
    }

    showToast?.("error", "Error", error);
  }, [error, showToast]);

  useEffect(() => {
    if (!detailsError) {
      return;
    }

    showToast?.("error", "Error", detailsError);
  }, [detailsError, showToast]);

  const openDetails = useCallback(async (payment) => {
    setSelectedPayment(payment);
    setDetailsVisible(true);
    setDetailsLoading(true);
    setDetailsError("");

    try {
      const response = await api.get(`/payments/${payment.payment_id}`);
      const payload = extractData(response);
      setSelectedPayment((prev) => ({
        ...(prev || {}),
        ...(payload || {}),
      }));
    } catch (apiError) {
      setDetailsError(extractErrorMessage(apiError, "Failed to load payment details."));
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  return (
    <div className="space-y-5">
      <PaymentsTable payments={payments} loading={loading} onViewDetails={openDetails} />

      <PaymentDetailsModal
        visible={detailsVisible}
        payment={selectedPayment}
        loading={detailsLoading}
        onHide={() => {
          setDetailsVisible(false);
          setDetailsError("");
          setSelectedPayment(null);
        }}
      />
    </div>
  );
}

export default PaymentsPage;
