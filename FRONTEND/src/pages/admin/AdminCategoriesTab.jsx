/**
 * @component AdminCategoriesTab
 * @description Orchestrator for the Categories management tab.
 *
 * Manages category CRUD (category_master table) with:
 *  - AdminCategoriesTable  → DataTable listing all active categories
 *  - CategoryFormModal     → Create/Edit dialog with Formik validation
 *  - CategoryDeleteDialog  → Confirmation dialog for safe soft-deletion
 *
 * Data flow: Full-list fetch (no server pagination) via adminCategoriesApi.
 * Pattern:   Pessimistic for all CRUD operations (reload after success).
 * Delete:    Soft-deletes the category and its full subtree (backend handles).
 *
 * API: adminCategoriesApi (fetchAllCategories, createCategory, updateCategory,
 *      deleteCategory)
 */
import { useState, useCallback, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { Button } from "primereact/button";
import { Plus } from "lucide-react";
import AdminCategoriesTable from "./AdminCategoriesTable";
import CategoryFormModal from "./CategoryFormModal";
import CategoryDeleteDialog from "./CategoryDeleteDialog";
import {
  fetchAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../api/adminCategoriesApi";
import getApiErrorMessage from "../../utils/apiError";
import "./AdminShared.css";

function AdminCategoriesTab() {
  const showToast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [formModal, setFormModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getErrorMessage = (error) =>
    getApiErrorMessage(error, "An unexpected error occurred.");

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      showToast("error", "Error", getErrorMessage(error));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // CRUD handlers
  const handleAdd = useCallback(() => {
    setSelectedCategory(null);
    setFormModal(true);
  }, []);

  const handleEdit = useCallback((category) => {
    setSelectedCategory(category);
    setFormModal(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormModal(false);
    setSelectedCategory(null);
  }, []);

  const handleSave = useCallback(
    async (formData) => {
      setSaving(true);
      try {
        if (selectedCategory) {
          await updateCategory(selectedCategory.category_id, formData);
          showToast("success", "Success", "Category updated successfully");
        } else {
          await createCategory(formData);
          showToast("success", "Success", "Category created successfully");
        }
        handleCloseForm();
        await loadCategories();
      } catch (error) {
        console.error("Failed to save category:", error);
        showToast("error", "Error", getErrorMessage(error));
      } finally {
        setSaving(false);
      }
    },
    [selectedCategory, loadCategories, handleCloseForm, showToast],
  );

  const handleDeleteClick = useCallback((category) => {
    setSelectedCategory(category);
    setDeleteDialog(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteDialog(false);
    setSelectedCategory(null);
  }, []);

  const handleConfirmDelete = useCallback(
    async (category) => {
      if (!category) return;
      setDeleting(true);
      try {
        await deleteCategory(category.category_id);
        showToast("success", "Success", "Category deleted successfully");
        handleCloseDelete();
        await loadCategories();
      } catch (error) {
        console.error("Failed to delete category:", error);
        showToast("error", "Error", getErrorMessage(error));
      } finally {
        setDeleting(false);
      }
    },
    [loadCategories, handleCloseDelete, showToast],
  );

  return (
    <div className="admin-products-container animate-fade-in flex-1 flex flex-col min-h-0">
      <div className="admin-products-card flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            type="button"
            className="admin-btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4" />
            <span>New Category</span>
          </Button>
        </div>

        <AdminCategoriesTable
          categories={categories}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      <CategoryFormModal
        visible={formModal}
        onHide={handleCloseForm}
        category={selectedCategory}
        categories={categories}
        onSave={handleSave}
        saving={saving}
      />

      <CategoryDeleteDialog
        visible={deleteDialog}
        onHide={handleCloseDelete}
        category={selectedCategory}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}

export default AdminCategoriesTab;
