/**
 * @component CategoryFormModal
 * @description PrimeReact Dialog for creating and editing categories.
 *
 * Form fields: name (required, 2-100 chars), parent_id (optional dropdown).
 * Validates with Formik + Yup.
 * On edit: filters the current category from parent options to prevent self-parent.
 * Backend enforces circular hierarchy protection.
 *
 * Props: visible, onHide, category (null = create), categories (full list for parent dropdown), onSave, saving
 * Consumed by: AdminCategoriesTab
 */
import { useEffect, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Category name is required")
    .min(2, "Minimum 2 characters")
    .max(100, "Maximum 100 characters"),
  parent_id: Yup.number().nullable(),
});

function CategoryFormModal({
  visible,
  onHide,
  category,
  categories,
  onSave,
  saving,
}) {
  const isEditing = Boolean(category);

  // Build parent dropdown options — exclude self on edit
  const parentOptions = useMemo(() => {
    const filtered = isEditing
      ? categories.filter((c) => c.category_id !== category.category_id)
      : categories;
    return filtered.map((c) => ({
      label: c.category_name,
      value: c.category_id,
    }));
  }, [categories, category, isEditing]);

  const formik = useFormik({
    initialValues: {
      name: "",
      parent_id: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      await onSave({
        name: values.name.trim(),
        parent_id: values.parent_id ?? null,
      });
    },
    enableReinitialize: true,
  });

  useEffect(() => {
    if (visible) {
      if (category) {
        formik.setValues({
          name: category.category_name || "",
          parent_id: category.parent_id ?? null,
        });
      } else {
        formik.resetForm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, visible]);

  const isFieldInvalid = (field) =>
    formik.touched[field] && formik.errors[field];

  const getErrorMessage = (field) =>
    formik.touched[field] && formik.errors[field] ? (
      <small className="text-red-500 text-xs mt-1 block">
        {formik.errors[field]}
      </small>
    ) : null;

  const footerContent = (
    <div className="flex justify-end gap-3 mt-4">
      <Button
        type="button"
        label="Cancel"
        onClick={onHide}
        disabled={saving}
        className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
        pt={{ root: { className: "border-none bg-transparent" } }}
      />
      <Button
        type="submit"
        label={saving ? "Saving..." : "Save"}
        onClick={formik.handleSubmit}
        disabled={saving || formik.isSubmitting}
        className="admin-btn-primary px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        pt={{ root: { className: "flex items-center justify-center" } }}
      />
    </div>
  );

  return (
    <Dialog
      header={isEditing ? "Edit Category" : "Add New Category"}
      visible={visible}
      style={{ width: "450px" }}
      breakpoints={{ "641px": "90vw" }}
      footer={footerContent}
      onHide={onHide}
      dismissableMask
      pt={{
        root: {
          className:
            "border-0 shadow-2xl rounded-2xl overflow-hidden admin-dialog",
        },
        header: { className: "admin-dialog-header px-6 py-5 border-b" },
        title: { className: "text-xl font-serif font-semibold" },
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
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col gap-5 mt-2 font-sans"
      >
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="cat-name"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Category Name <span className="text-red-500">*</span>
          </label>
          <InputText
            id="cat-name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`admin-input w-full rounded-lg h-10 px-3 text-sm ${
              isFieldInvalid("name") ? "p-invalid border-red-500" : ""
            }`}
            placeholder="e.g. Electronics, Clothing"
          />
          {getErrorMessage("name")}
        </div>

        {/* Parent Category */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="cat-parent"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Parent Category
            <span className="ml-1 text-xs font-normal text-gray-400">
              (optional — leave empty for root)
            </span>
          </label>
          <Dropdown
            id="cat-parent"
            value={formik.values.parent_id}
            options={parentOptions}
            onChange={(e) => formik.setFieldValue("parent_id", e.value)}
            placeholder="None (root category)"
            showClear
            filter
            filterPlaceholder="Search categories..."
            className="admin-input w-full text-sm"
            pt={{
              root: { className: "rounded-lg h-10 flex items-center" },
              input: { className: "py-0 text-sm" },
            }}
          />
        </div>
      </form>
    </Dialog>
  );
}

export default CategoryFormModal;
