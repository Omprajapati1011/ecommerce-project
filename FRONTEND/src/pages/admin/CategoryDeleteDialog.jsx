/**
 * @component CategoryDeleteDialog
 * @description Confirmation dialog shown before deleting a category.
 *
 * Warns that deleting will also soft-delete all subcategories.
 * Uses PrimeReact Dialog with the shared admin-dialog theme.
 *
 * Props: visible, onHide, category, onConfirm, deleting
 * Consumed by: AdminCategoriesTab
 */
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { AlertTriangle } from "lucide-react";

function CategoryDeleteDialog({
  visible,
  onHide,
  category,
  onConfirm,
  deleting,
}) {
  const footerContent = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        label="Cancel"
        onClick={onHide}
        disabled={deleting}
        className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
        pt={{ root: { className: "border-none bg-transparent" } }}
      />
      <Button
        type="button"
        label={deleting ? "Deleting..." : "Delete"}
        onClick={() => onConfirm(category)}
        disabled={deleting}
        severity="danger"
        className="bg-red-600 hover:bg-red-700 text-white border-none px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
      />
    </div>
  );

  return (
    <Dialog
      header="Confirm Deletion"
      visible={visible}
      style={{ width: "420px" }}
      breakpoints={{ "641px": "90vw" }}
      footer={footerContent}
      onHide={onHide}
      dismissableMask
      pt={{
        root: {
          className:
            "border-0 shadow-2xl rounded-2xl overflow-hidden admin-dialog",
        },
        header: { className: "admin-dialog-header px-6 py-4 border-b" },
        title: { className: "text-lg font-semibold text-red-600" },
        content: { className: "p-6" },
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
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
          Are you sure you want to delete this category?
        </p>
        {category && (
          <p className="text-gray-900 dark:text-gray-100 font-semibold text-base mb-4">
            "{category.category_name}"
          </p>
        )}
        <p className="text-gray-500 dark:text-gray-400 text-xs">
          This will also delete all subcategories. This action can be restored
          later.
        </p>
      </div>
    </Dialog>
  );
}

export default CategoryDeleteDialog;
