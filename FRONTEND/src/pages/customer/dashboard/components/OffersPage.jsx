import { useCallback, useEffect, useMemo, useState } from "react";
import { Tag } from "lucide-react";
import api from "../../../../../api/api";
import OfferCard from "./OfferCard";

const toArray = (value) => (Array.isArray(value) ? value : []);
const extractData = (response) => response?.data?.data ?? null;

const extractErrorMessage = (apiError, fallback) => {
  const responseData = apiError?.response?.data;
  if (typeof responseData === "string" && responseData.trim())
    return responseData;
  if (responseData?.message) return responseData.message;
  if (apiError?.message) return apiError.message;
  return fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function OfferCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-200/60 bg-white p-5 dark:border-[#1f2933] dark:bg-[#151e22]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/5 animate-pulse rounded-lg bg-gray-200 dark:bg-[#1f2933]" />
          <div className="h-3.5 w-full animate-pulse rounded bg-gray-100 dark:bg-[#1a2327]" />
          <div className="h-3.5 w-4/5 animate-pulse rounded bg-gray-100 dark:bg-[#1a2327]" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-[#1f2933]" />
      </div>
      <div className="border-t border-dashed border-gray-200 dark:border-[#1f2933]" />
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-[#1a2327]" />
            <div className="h-3.5 w-1/4 animate-pulse rounded bg-gray-100 dark:bg-[#1a2327]" />
          </div>
        ))}
      </div>
      <div className="mt-1 h-10 animate-pulse rounded-xl bg-amber-50 dark:bg-amber-500/10" />
    </div>
  );
}

function AlertBanner({ type, message }) {
  const styles = {
    success:
      "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300",
    error:
      "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300",
    info: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-300",
  };
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${styles[type]}`}
    >
      <span className="mt-px shrink-0 font-bold">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}

function OffersPage({ showToast }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [applyingId, setApplyingId] = useState(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/offer/active");
      const payload = toArray(extractData(response));
      const sorted = [...payload].sort(
        (a, b) => Number(b?.offer_id || 0) - Number(a?.offer_id || 0),
      );
      setOffers(sorted);
    } catch (apiError) {
      setError(extractErrorMessage(apiError, "Failed to load active offers."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    if (successMessage) showToast?.("success", "Success", successMessage);
  }, [showToast, successMessage]);

  useEffect(() => {
    if (error) showToast?.("error", "Error", error);
  }, [error, showToast]);

  const handleApplyOffer = useCallback(async (offer) => {
    const offerName = offer?.offer_name;
    if (!offerName) {
      setError("Offer name is missing for this record.");
      return;
    }

    const offerId = Number(offer?.offer_id) || null;
    setApplyingId(offerId);
    setError("");
    setSuccessMessage("");

    const payload = { offer_name: offerName };
    if (offer?.product_id != null) payload.product_id = offer.product_id;
    if (offer?.category_id != null) payload.category_id = offer.category_id;

    try {
      const response = await api.post("/offer/validate", payload);
      const validationResult = extractData(response) || {};
      const discount = Number(validationResult?.discount_amount) || 0;
      const finalAmount = Number(validationResult?.final_amount) || 0;
      setSuccessMessage(
        `${offerName} applied! Discount: ${formatCurrency(discount)} — Final: ${formatCurrency(finalAmount)}`,
      );
    } catch (apiError) {
      setError(extractErrorMessage(apiError, "Failed to validate offer."));
    } finally {
      setApplyingId(null);
    }
  }, []);

  const hasOffers = useMemo(() => offers.length > 0, [offers.length]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-2xl border border-amber-200/60 bg-white p-5 dark:border-[#1f2933] dark:bg-[#151e22]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
            <Tag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </span>
          <div>
            <h2 className="font-serif text-2xl text-gray-900 dark:text-slate-100">
              Active Offers
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Browse available offers and validate them against your cart.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback banners */}
      {successMessage && (
        <AlertBanner type="success" message={successMessage} />
      )}
      {error && <AlertBanner type="error" message={error} />}

      {/* Skeletons */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <OfferCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasOffers && (
        <AlertBanner
          type="info"
          message="No active offers are available right now. Check back soon!"
        />
      )}

      {/* Offer cards */}
      {!loading && hasOffers && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard
              key={offer.offer_id}
              offer={offer}
              applyingId={applyingId}
              onApply={handleApplyOffer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default OffersPage;
