import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "../../../../../api/api";
import { fetchAllUserOrders } from "../orderData";
import EditReviewModal from "./EditReviewModal";
import ReviewCard from "./ReviewCard";

const toArray = (value) => (Array.isArray(value) ? value : []);
const extractData = (response) => response?.data?.data ?? null;

const extractErrorMessage = (apiError, fallback) => {
  const responseData = apiError?.response?.data;
  if (typeof responseData === "string" && responseData.trim()) return responseData;
  if (responseData?.message) return responseData.message;
  if (apiError?.message) return apiError.message;
  return fallback;
};

const extractSuccessMessage = (response, fallback) =>
  response?.data?.message || response?.data?.data?.message || fallback;

const normalizeProfilePayload = (payload) =>
  Array.isArray(payload) ? payload[0] : payload;

const normalizeName = (value) => String(value || "").trim().toLowerCase();

function UserReviewsPage({ showToast }) {
  const { currentUser } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewableProducts, setReviewableProducts] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [selectedReview, setSelectedReview] = useState(null);
  const [savingReview, setSavingReview] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [helpfulLoadingId, setHelpfulLoadingId] = useState(null);

  const getReviewDetails = useCallback(async (reviewId) => {
    const response = await api.get(`/review/${reviewId}`);
    return extractData(response);
  }, []);

  const findOwnedReviewForProduct = useCallback(
    async (items, userNameNormalized, userId) => {
      if (!items.length) {
        return null;
      }

      const byName = userNameNormalized
        ? items.filter(
            (item) => normalizeName(item?.reviewer_name) === userNameNormalized,
          )
        : [];

      const pool = byName.length > 0 ? byName : items;

      if (!userId) {
        return pool[0] || null;
      }

      const detailChecks = await Promise.all(
        pool.map(async (review) => {
          try {
            const detail = await getReviewDetails(review.review_id);
            if (Number(detail?.user_id) === Number(userId)) {
              return {
                ...review,
                ...detail,
              };
            }
          } catch {
            // ignore detail fetch failure for individual review
          }
          return null;
        }),
      );

      return detailChecks.find(Boolean) || null;
    },
    [getReviewDetails],
  );

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [profileRes, ordersRes] = await Promise.all([
        api.get("/users/view-profile"),
        fetchAllUserOrders(api),
      ]);

      const profile = normalizeProfilePayload(extractData(profileRes));
      const userNameNormalized = normalizeName(profile?.name || currentUser?.name);
      const userId = Number(currentUser?.user_id) || null;

      const orders = toArray(ordersRes);
      const itemGroups = await Promise.all(
        orders.map(async (order) => {
          try {
            const response = await api.get(`/order-item/${order.order_id}/items`);
            return toArray(extractData(response));
          } catch {
            return [];
          }
        }),
      );

      const productMap = new Map();
      itemGroups.flat().forEach((item) => {
        const productId = Number(item?.product_id);
        if (!productId || productMap.has(productId)) {
          return;
        }

        productMap.set(productId, {
          product_id: productId,
          product_name: item?.product_name || `Product #${productId}`,
        });
      });

      const products = [...productMap.values()];
      if (products.length === 0) {
        setReviews([]);
        setReviewableProducts([]);
        return;
      }

      const productReviews = await Promise.all(
        products.map(async (product) => {
          try {
            const response = await api.get(`/review/product/${product.product_id}`, {
              params: { page: 1, limit: 100, sort: "newest" },
            });
            return {
              product,
              items: toArray(extractData(response)?.items),
            };
          } catch {
            return { product, items: [] };
          }
        }),
      );

      const userReviews = [];
      const reviewedProductIds = new Set();

      for (const entry of productReviews) {
        const owned = await findOwnedReviewForProduct(
          entry.items,
          userNameNormalized,
          userId,
        );

        if (!owned) {
          continue;
        }

        reviewedProductIds.add(Number(entry.product.product_id));
        userReviews.push({
          ...owned,
          product_id: Number(entry.product.product_id),
          product_name: entry.product.product_name,
        });
      }

      const sorted = [...userReviews].sort((a, b) => {
        const aDate = new Date(a?.created_at || 0).getTime();
        const bDate = new Date(b?.created_at || 0).getTime();
        if (aDate !== bDate) return bDate - aDate;
        return Number(b?.review_id || 0) - Number(a?.review_id || 0);
      });

      setReviews(sorted);
      setReviewableProducts(
        products.filter(
          (product) => !reviewedProductIds.has(Number(product.product_id)),
        ),
      );
    } catch (apiError) {
      setError(extractErrorMessage(apiError, "Failed to load user reviews."));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.name, currentUser?.user_id, findOwnedReviewForProduct]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    showToast?.("success", "Success", successMessage);
  }, [showToast, successMessage]);

  useEffect(() => {
    if (!error) {
      return;
    }

    showToast?.("error", "Error", error);
  }, [error, showToast]);

  useEffect(() => {
    if (!modalError) {
      return;
    }

    showToast?.("error", "Error", modalError);
  }, [modalError, showToast]);

  const openEditModal = useCallback((review) => {
    setModalMode("edit");
    setSelectedReview(review);
    setModalError("");
    setModalVisible(true);
  }, []);

  const openCreateModal = useCallback(() => {
    setModalMode("create");
    setSelectedReview(null);
    setModalError("");
    setModalVisible(true);
  }, []);

  const handleSaveReview = useCallback(
    async (payload) => {
      setSavingReview(true);
      setModalError("");
      setError("");
      setSuccessMessage("");

      try {
        if (modalMode === "create") {
          const response = await api.post("/review", payload);
          setSuccessMessage(
            extractSuccessMessage(response, "Review created successfully."),
          );
        } else {
          const response = await api.put(
            `/review/updateReview/${selectedReview.review_id}`,
            payload,
          );
          setSuccessMessage(
            extractSuccessMessage(response, "Review updated successfully."),
          );
        }

        setModalVisible(false);
        setSelectedReview(null);
        await loadReviews();
      } catch (apiError) {
        setModalError(
          extractErrorMessage(
            apiError,
            modalMode === "create"
              ? "Failed to create review."
              : "Failed to update review.",
          ),
        );
      } finally {
        setSavingReview(false);
      }
    },
    [loadReviews, modalMode, selectedReview?.review_id],
  );

  const handleDeleteReview = useCallback(async (review) => {
    const reviewId = Number(review?.review_id);
    if (!reviewId) return;

    const confirmed = window.confirm("Delete this review?");
    if (!confirmed) return;

    setDeleteLoadingId(reviewId);
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.delete(`/review/deleteReview/${reviewId}`);
      setSuccessMessage(extractSuccessMessage(response, "Review deleted successfully."));
      setReviews((prev) =>
        prev.filter((item) => Number(item.review_id) !== Number(reviewId)),
      );
      setReviewableProducts((prev) => {
        const exists = prev.some(
          (product) => Number(product.product_id) === Number(review.product_id),
        );
        if (exists) return prev;
        return [
          ...prev,
          {
            product_id: Number(review.product_id),
            product_name: review.product_name || `Product #${review.product_id}`,
          },
        ];
      });
    } catch (apiError) {
      setError(extractErrorMessage(apiError, "Failed to delete review."));
    } finally {
      setDeleteLoadingId(null);
    }
  }, []);

  const handleToggleHelpful = useCallback(async (review) => {
    const reviewId = Number(review?.review_id);
    if (!reviewId) return;

    setHelpfulLoadingId(reviewId);
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.patch(`/review/${reviewId}/helpful`);
      const payload = extractData(response);
      const action = payload?.action || "";
      const helpfulCount = Number(payload?.helpful_count) || 0;
      setSuccessMessage(
        action === "liked"
          ? "Review marked as helpful."
          : "Helpful mark removed successfully.",
      );

      setReviews((prev) =>
        prev.map((item) =>
          Number(item.review_id) === reviewId
            ? {
                ...item,
                helpful_count: helpfulCount,
                is_liked_by_me: action === "liked",
              }
            : item,
        ),
      );
    } catch (apiError) {
      setError(extractErrorMessage(apiError, "Failed to update helpful vote."));
    } finally {
      setHelpfulLoadingId(null);
    }
  }, []);

  const hasReviews = useMemo(() => reviews.length > 0, [reviews.length]);

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.8)] dark:border-[#1f2933] dark:bg-[#151e22]">
        <div className="flex items-center gap-3">
          <ProgressSpinner style={{ width: "24px", height: "24px" }} strokeWidth="4" />
          <p className="text-sm text-gray-600 dark:text-slate-300">Loading reviews...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_38px_-30px_rgba(15,23,42,0.8)] dark:border-[#1f2933] dark:bg-[#151e22]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
              My Reviews
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Manage your product feedback and track helpful votes.
            </p>
          </div>
          <Button
            type="button"
            icon="pi pi-plus"
            label="Write Review"
            disabled={reviewableProducts.length === 0}
            onClick={openCreateModal}
            className="!w-full !rounded-xl !bg-amber-500 !px-4 !py-2 !text-sm !font-semibold !text-[#132a29] hover:!bg-amber-400 sm:!w-auto"
          />
        </div>
      </Card>

      {!hasReviews ? (
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.8)] dark:border-[#1f2933] dark:bg-[#151e22]">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You have not added any reviews yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              deleteLoadingId={deleteLoadingId}
              helpfulLoadingId={helpfulLoadingId}
              onEdit={openEditModal}
              onDelete={handleDeleteReview}
              onToggleHelpful={handleToggleHelpful}
            />
          ))}
        </div>
      )}

      <EditReviewModal
        visible={modalVisible}
        mode={modalMode}
        review={selectedReview}
        reviewableProducts={reviewableProducts}
        saving={savingReview}
        onHide={() => {
          setModalVisible(false);
          setSelectedReview(null);
          setModalError("");
        }}
        onSubmit={handleSaveReview}
        onValidationError={setModalError}
      />
    </div>
  );
}

export default UserReviewsPage;
