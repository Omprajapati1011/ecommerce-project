/**
 * @component AdminPortionsTab
 * @description Orchestrator for the Portions management tab.
 *
 * Manages standalone portion CRUD (portion_master table) with:
 *  - AdminPortionsTable  → DataTable listing all portions with skeleton loading
 *  - PortionFormModal    → Create/Edit dialog with Formik validation
 *  - PortionDeleteDialog → Confirmation dialog for safe deletion
 *
 * Data flow: Full-list fetch (no pagination) via adminPortionsApi.
 * Pattern:   Optimistic UI updates for status toggles; pessimistic for CRUD.
 *
 * API: adminPortionsApi (fetchPortions, createPortion, updatePortion,
 *      togglePortionStatus, deletePortion)
 */
import { useState, useCallback, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { Button } from "primereact/button";
import { Plus } from "lucide-react";
import AdminPortionsTable from "./AdminPortionsTable";
import PortionFormModal from "./PortionFormModal";
import PortionDeleteDialog from "./PortionDeleteDialog";
import {
  fetchPortions,
  createPortion,
  updatePortion,
  togglePortionStatus,
  deletePortion,
} from "../../../api/adminPortionsApi";
import getApiErrorMessage from "../../utils/apiError";
import "./AdminShared.css";

function AdminPortionsTab() {
  const showToast = useToast();

  const [portions, setPortions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [formModal, setFormModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPortion, setSelectedPortion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getErrorMessage = (error) =>
    getApiErrorMessage(error, "An unexpected error occurred.");

  // Load portions
  const loadPortions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPortions();
      setPortions(data);
    } catch (error) {
      console.error("Failed to load portions:", error);
      showToast("error", "Error", getErrorMessage(error));
      setPortions([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load on mount
  useEffect(() => {
    loadPortions();
  }, [loadPortions]);

  // CRUD handlers
  const handleAdd = useCallback(() => {
    setSelectedPortion(null);
    setFormModal(true);
  }, []);

  const handleEdit = useCallback((portion) => {
    setSelectedPortion(portion);
    setFormModal(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormModal(false);
    setSelectedPortion(null);
  }, []);

  const handleSave = useCallback(
    async (formData) => {
      setSaving(true);
      try {
        if (selectedPortion) {
          await updatePortion(selectedPortion.portion_id, formData);
          showToast("success", "Success", "Portion updated successfully");
        } else {
          await createPortion(formData);
          showToast("success", "Success", "Portion created successfully");
        }
        handleCloseForm();
        await loadPortions();
      } catch (error) {
        console.error("Failed to save portion:", error);
        showToast("error", "Error", getErrorMessage(error));
      } finally {
        setSaving(false);
      }
    },
    [selectedPortion, loadPortions, handleCloseForm, showToast],
  );

  const handleDeleteClick = useCallback((portion) => {
    setSelectedPortion(portion);
    setDeleteDialog(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteDialog(false);
    setSelectedPortion(null);
  }, []);

  const handleConfirmDelete = useCallback(
    async (portion) => {
      if (!portion) return;
      setDeleting(true);
      try {
        await deletePortion(portion.portion_id);
        showToast("success", "Success", "Portion deleted successfully");
        handleCloseDelete();
        await loadPortions();
      } catch (error) {
        console.error("Failed to delete portion:", error);
        showToast("error", "Error", getErrorMessage(error));
      } finally {
        setDeleting(false);
      }
    },
    [loadPortions, handleCloseDelete, showToast],
  );

  const handleToggleStatus = useCallback(
    async (portion) => {
      // Optimistic update
      setPortions((prev) =>
        prev.map((p) =>
          p.portion_id === portion.portion_id
            ? { ...p, is_active: !p.is_active }
            : p,
        ),
      );
      try {
        await togglePortionStatus(portion.portion_id);
        showToast(
          "success",
          "Success",
          `Portion ${portion.is_active ? "deactivated" : "activated"} successfully`,
        );
      } catch (error) {
        // Revert
        setPortions((prev) =>
          prev.map((p) =>
            p.portion_id === portion.portion_id
              ? { ...p, is_active: portion.is_active }
              : p,
          ),
        );
        showToast("error", "Error", getErrorMessage(error));
      }
    },
    [showToast],
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
            <span>New Portion</span>
          </Button>
        </div>

        <AdminPortionsTable
          portions={portions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <PortionFormModal
        visible={formModal}
        onHide={handleCloseForm}
        portion={selectedPortion}
        onSave={handleSave}
        saving={saving}
      />

      <PortionDeleteDialog
        visible={deleteDialog}
        onHide={handleCloseDelete}
        portion={selectedPortion}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}

export default AdminPortionsTab;
