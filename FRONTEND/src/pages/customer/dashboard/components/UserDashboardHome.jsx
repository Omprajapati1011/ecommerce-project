import { useEffect, useMemo, useState } from "react";
import { Message } from "primereact/message";
import api from "../../../../../api/api";
import getApiErrorMessage from "../../../../utils/apiError";
import { fetchAllUserOrders } from "../orderData";
import DashboardSummaryCards from "./DashboardSummaryCards";
import RecentOrdersList from "./RecentOrdersList";

const toArray = (value) => (Array.isArray(value) ? value : []);
const extractData = (response) => response?.data?.data ?? null;

function UserDashboardHome({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [addressesCount, setAddressesCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadDashboardHome = async () => {
      setLoading(true);
      setError("");

      try {
        const [ordersRes, addressesRes, offersRes] = await Promise.all([
          fetchAllUserOrders(api),
          api.get("/users/show-addresses"),
          api.get("/offer/active"),
        ]);

        if (!active) {
          return;
        }

        const ordersPayload = toArray(ordersRes);
        const sortedOrders = [...ordersPayload].sort((a, b) => {
          const aDate = new Date(a?.created_at || a?.placed_at || 0).getTime();
          const bDate = new Date(b?.created_at || b?.placed_at || 0).getTime();
          if (aDate !== bDate) return bDate - aDate;
          return Number(b?.order_id || 0) - Number(a?.order_id || 0);
        });

        setOrders(sortedOrders);
        setAddressesCount(toArray(extractData(addressesRes)).length);
        setOffersCount(toArray(extractData(offersRes)).length);
      } catch (apiError) {
        if (!active) {
          return;
        }

        setError(
          getApiErrorMessage(
            apiError,
            "We could not load your dashboard summary right now. Please try again.",
          ),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboardHome();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    showToast?.("error", "Error", error);
  }, [error, showToast]);

  const summary = useMemo(
    () => ({
      totalOrders: orders.length,
      savedAddresses: addressesCount,
      activeOffers: offersCount,
    }),
    [orders.length, addressesCount, offersCount],
  );

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="space-y-6">
      <DashboardSummaryCards summary={summary} loading={loading} />
      {error && <Message severity="error" text={error} className="w-full" />}
      <RecentOrdersList orders={recentOrders} loading={loading} />
    </div>
  );
}

export default UserDashboardHome;
