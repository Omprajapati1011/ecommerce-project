import { useState, useEffect, useCallback, useRef } from "react";
import {
  Star,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Toast } from "primereact/toast";
import api from "../../../api/api.js";

const ROWS_OPTIONS = [10, 20, 50];

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-600 dark:text-slate-400">
        {rating}
      </span>
    </span>
  );
}

function ReviewTextCell({ title, text }) {
  return (
    <div className="min-w-0">
      {title && (
        <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-200">
          {title}
        </p>
      )}
      {text && (
        <p className="line-clamp-1 text-xs text-gray-500 dark:text-slate-400">
          {text}
        </p>
      )}
      {!title && !text && (
        <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40 hover:border-amber-400 hover:text-amber-600 dark:border-[#1f2933] dark:text-slate-400 dark:hover:border-amber-500 dark:hover:text-amber-400"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs text-gray-600 dark:text-slate-400">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40 hover:border-amber-400 hover:text-amber-600 dark:border-[#1f2933] dark:text-slate-400 dark:hover:border-amber-500 dark:hover:text-amber-400"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function TableSkeleton({ rows = 8 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100 dark:border-[#1f2933]">
          {Array.from({ length: 6 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-[#1f2933]" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function AdminReviewsTab() {
  const toast = useRef(null);

  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, ratingFilter, sortField, sortOrder, limit]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        sortField,
        sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(ratingFilter && { rating: ratingFilter }),
      });
      const res = await api.get(`/review/admin?${params}`);
      const data = res.data?.data ?? res.data;
      setReviews(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load reviews",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, ratingFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = useCallback(
    async (reviewId) => {
      setDeletingId(reviewId);
      try {
        await api.delete(`/review/deleteReview/${reviewId}`);
        toast.current?.show({
          severity: "success",
          summary: "Deleted",
          detail: "Review deleted successfully",
          life: 3000,
        });
        setConfirmId(null);
        fetchReviews();
      } catch {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to delete review",
          life: 3000,
        });
      } finally {
        setDeletingId(null);
      }
    },
    [fetchReviews],
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
    return (
      <span className="ml-1 text-amber-500">
        {sortOrder === "desc" ? "↓" : "↑"}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <Toast ref={toast} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search product or reviewer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 dark:border-[#1f2933] dark:bg-[#151e22] dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-amber-500"
          />
        </div>

        {/* Rating filter */}
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 dark:border-[#1f2933] dark:bg-[#151e22] dark:text-slate-200"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} Stars
            </option>
          ))}
        </select>

        {/* Rows per page */}
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 dark:border-[#1f2933] dark:bg-[#151e22] dark:text-slate-200"
        >
          {ROWS_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>

        <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">
          {total.toLocaleString()} review{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-[#1f2933] dark:bg-[#151e22]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#1f2933]">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Product
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Reviewer
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                onClick={() => toggleSort("rating")}
              >
                Rating <SortIcon field="rating" />
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Review
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                onClick={() => toggleSort("helpful_count")}
              >
                Helpful <SortIcon field="helpful_count" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                onClick={() => toggleSort("created_at")}
              >
                Date <SortIcon field="created_at" />
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Action
              </th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={limit} />
          ) : reviews.length === 0 ? (
            <tbody>
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-16 text-center text-sm text-gray-400 dark:text-slate-500"
                >
                  No reviews found.
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {reviews.map((review) => (
                <tr
                  key={review.review_id}
                  className="border-b border-gray-50 transition hover:bg-amber-50/40 dark:border-[#1a2430] dark:hover:bg-amber-500/5 last:border-0"
                >
                  {/* Product */}
                  <td className="max-w-[180px] px-4 py-3">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-slate-200">
                      {review.product_name}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">
                      #{review.product_id}
                    </p>
                  </td>

                  {/* Reviewer */}
                  <td className="max-w-[140px] px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm text-gray-700 dark:text-slate-300">
                        {review.reviewer_name}
                      </p>
                      {Number(review.is_verified_purchase) === 1 && (
                        <ShieldCheck
                          className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                          title="Verified Purchase"
                        />
                      )}
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3">
                    <StarRating rating={Number(review.rating)} />
                  </td>

                  {/* Review text */}
                  <td className="max-w-[220px] px-4 py-3">
                    <ReviewTextCell
                      title={review.title}
                      text={review.review_text}
                    />
                  </td>

                  {/* Helpful count */}
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                    {review.helpful_count ?? 0}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(review.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-3">
                    {confirmId === review.review_id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(review.review_id)}
                          disabled={deletingId === review.review_id}
                          className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                        >
                          {deletingId === review.review_id
                            ? "Deleting…"
                            : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-500 transition hover:bg-gray-50 dark:border-[#1f2933] dark:bg-[#151e22] dark:text-slate-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(review.review_id)}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-[#1f2933] dark:bg-[#151e22] dark:text-slate-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
            {total}
          </p>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      )}
    </div>
  );
}

export default AdminReviewsTab;
