import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Rating } from "primereact/rating";

function EditReviewModal({
  mode,
  onHide,
  onSubmit,
  onValidationError,
  review,
  reviewableProducts,
  saving,
  visible,
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [productId, setProductId] = useState(null);

  const isCreateMode = mode === "create";

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isCreateMode) {
      setRating(0);
      setTitle("");
      setReviewText("");
      setProductId(reviewableProducts?.[0]?.product_id ?? null);
      return;
    }

    setRating(Number(review?.rating) || 0);
    setTitle(review?.title || "");
    setReviewText(review?.review_text || "");
    setProductId(Number(review?.product_id) || null);
  }, [isCreateMode, review, reviewableProducts, visible]);

  const productOptions = useMemo(
    () =>
      (reviewableProducts || []).map((product) => ({
        label: product.product_name || `Product #${product.product_id}`,
        value: Number(product.product_id),
      })),
    [reviewableProducts],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating || Number(rating) < 1) {
      onValidationError?.("Please select a rating.");
      return;
    }

    if (isCreateMode && !productId) {
      onValidationError?.("Please select a product.");
      return;
    }

    const payload = {
      rating: Number(rating),
      title: title.trim() || null,
      review_text: reviewText.trim() || null,
    };

    if (isCreateMode) {
      payload.product_id = Number(productId);
    }

    await onSubmit(payload);
  };

  return (
    <Dialog
      header={isCreateMode ? "Write Review" : "Edit Review"}
      className="address-dialog review-dialog !overflow-hidden"
      visible={visible}
      style={{ width: "92vw", maxWidth: "760px" }}
      breakpoints={{ "960px": "94vw", "641px": "96vw" }}
      onHide={onHide}
      dismissableMask
    >
      <form onSubmit={handleSubmit} className="address-dialog-form review-dialog-form space-y-5">
        <p className="address-dialog-subtitle text-sm text-slate-500 dark:text-slate-400">
          {isCreateMode
            ? "Share your product experience to help other customers."
            : "Update your review details."}
        </p>
        {isCreateMode && (
          <FloatLabel>
            <Dropdown
              inputId="review_product"
              value={productId}
              onChange={(event) => setProductId(event.value)}
              options={productOptions}
              optionLabel="label"
              optionValue="value"
              className="address-dialog-input review-dialog-dropdown w-full !rounded-xl"
              filter
            />
            <label htmlFor="review_product">Product</label>
          </FloatLabel>
        )}

        <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Rating
          </p>
          <div className="mt-2">
            <Rating value={rating} onChange={(event) => setRating(event.value)} cancel={false} />
          </div>
        </div>

        <FloatLabel>
          <InputText
            id="review_title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="address-dialog-input w-full !rounded-xl"
          />
          <label htmlFor="review_title">Review Title</label>
        </FloatLabel>

        <FloatLabel>
          <InputTextarea
            id="review_text"
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            className="address-dialog-input address-dialog-textarea w-full !rounded-xl"
            rows={4}
          />
          <label htmlFor="review_text">Review Text</label>
        </FloatLabel>

        <Divider className="!my-2 address-dialog-divider" />

        <div className="address-dialog-actions flex flex-wrap justify-end gap-2 pt-1">
          <Button
            type="button"
            label="Cancel"
            icon="pi pi-times"
            outlined
            onClick={onHide}
            disabled={saving}
            className="!w-full !rounded-xl !border-slate-300 !text-slate-700 hover:!bg-slate-100 dark:!border-slate-600 dark:!text-slate-200 dark:hover:!bg-slate-800 sm:!w-auto"
          />
          <Button
            type="submit"
            label={saving ? "Saving..." : isCreateMode ? "Submit Review" : "Save Changes"}
            icon={isCreateMode ? "pi pi-send" : "pi pi-save"}
            disabled={saving}
            loading={saving}
            className="!w-full !rounded-xl !bg-[#1d7f75] !px-5 !py-2.5 !text-sm !font-semibold !text-white hover:!bg-[#17665e] sm:!w-auto"
          />
        </div>
      </form>
    </Dialog>
  );
}

export default EditReviewModal;
