import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { Divider } from "primereact/divider";
import { Rating } from "primereact/rating";

function ReviewCard({
  deleteLoadingId,
  helpfulLoadingId,
  onDelete,
  onEdit,
  onToggleHelpful,
  review,
}) {
  const isDeleting = Number(deleteLoadingId) === Number(review.review_id);
  const isTogglingHelpful = Number(helpfulLoadingId) === Number(review.review_id);

  return (
    <Card className="h-full rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_30px_-28px_rgba(15,23,42,0.95)] dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {review.product_name || `Product #${review.product_id}`}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Rating value={Number(review.rating) || 0} readOnly cancel={false} />
            <Chip
              label={`${Number(review.rating) || 0}/5`}
              className="!h-7 !bg-slate-100 !text-xs !font-medium !text-slate-700 dark:!bg-slate-700 dark:!text-slate-200"
            />
          </div>
        </div>
      </div>

      <Divider className="!my-3" />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {review.title || "Untitled Review"}
        </p>
        <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
          {review.review_text || "-"}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/70 pt-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          label={`${Number(review.helpful_count) || 0} Helpful`}
          icon="pi pi-thumbs-up"
          text
          severity={review.is_liked_by_me ? "success" : "secondary"}
          disabled={isTogglingHelpful}
          className="!w-full !justify-center sm:!w-auto sm:!justify-start"
          onClick={() => onToggleHelpful(review)}
        />

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            label="Edit Review"
            icon="pi pi-pencil"
            outlined
            size="small"
            className="!w-full !rounded-lg sm:!w-auto"
            onClick={() => onEdit(review)}
          />
          <Button
            type="button"
            label={isDeleting ? "Deleting..." : "Delete Review"}
            icon="pi pi-trash"
            severity="danger"
            outlined
            size="small"
            className="!w-full !rounded-lg sm:!w-auto"
            disabled={isDeleting}
            onClick={() => onDelete(review)}
          />
        </div>
      </div>
    </Card>
  );
}

export default ReviewCard;
