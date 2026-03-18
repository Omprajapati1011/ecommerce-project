import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

function OfferDeleteDialog({ visible, onHide, offer, onConfirm, deleting }) {
  const footerContent = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        label="Cancel"
        onClick={onHide}
        disabled={deleting}
        className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
      />
      <Button
        type="button"
        label={deleting ? "Deleting..." : "Delete"}
        icon={deleting ? "pi pi-spin pi-spinner" : "pi pi-trash"}
        onClick={() => offer && onConfirm(offer)}
        disabled={deleting || !offer}
        severity="danger"
        className="!bg-red-600 hover:!bg-red-700 !text-white !border-none px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
      />
    </div>
  );

  return (
    <Dialog
      header="Confirm Deletion"
      visible={visible}
      onHide={onHide}
      draggable={false}
      style={{ width: "400px" }}
      breakpoints={{ "641px": "90vw" }}
      footer={footerContent}
      dismissableMask
      className="admin-dialog"
      pt={{
        root: { className: "admin-dialog rounded-2xl overflow-hidden" },
        header: { className: "admin-dialog-header px-6 py-4 border-b" },
        title: { className: "text-lg font-semibold text-red-600 font-serif" },
        content: { className: "p-6 font-sans" },
        footer: {
          className: "admin-dialog-footer px-6 py-4 border-t rounded-b-2xl",
        },
        closeButton: {
          className:
            "w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors",
        },
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <i className="pi pi-exclamation-triangle text-3xl text-red-600 dark:text-red-400" />
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
          Are you sure you want to delete this offer?
        </p>
        {offer && (
          <p className="text-gray-900 dark:text-gray-100 font-semibold text-base mb-4">
            &quot;{offer.offer_name}&quot;
          </p>
        )}
        <p className="text-gray-500 dark:text-gray-400 text-xs">
          This action cannot be undone. The offer will be permanently removed.
        </p>
      </div>
    </Dialog>
  );
}

export default OfferDeleteDialog;
