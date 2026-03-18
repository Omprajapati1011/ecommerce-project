/**
 * @component AdminModifiersTab
 * @description Orchestrator for the Modifiers management tab.
 *
 * Manages standalone modifier CRUD (modifier_master table) with:
 *  - AdminModifiersTable  → DataTable listing all modifiers with skeleton loading
 *  - ModifierFormModal    → Create/Edit dialog with Formik validation
 *  - ModifierDeleteDialog → Confirmation dialog for safe deletion
 *
 * Data flow: Full-list fetch (no pagination) via adminModifiersApi.
 * Pattern:   Optimistic UI updates for status toggles; pessimistic for CRUD.
 *
 * API: adminModifiersApi (fetchModifiers, createModifier, updateModifier,
 *      toggleModifierStatus, deleteModifier)
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Plus } from "lucide-react";
import AdminModifiersTable from "./AdminModifiersTable";
import ModifierFormModal from "./ModifierFormModal";
import ModifierDeleteDialog from "./ModifierDeleteDialog";
import {
  fetchModifiers,
  createModifier,
  updateModifier,
  toggleModifierStatus,
  deleteModifier,
} from "../../../api/adminModifiersApi";
import "./AdminShared.css";

function AdminModifiersTab() {
  const toast = useRef(null);

  const [modifiers, setModifiers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [formModal, setFormModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedModifier, setSelectedModifier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const getErrorMessage = (error) =>
    error.response?.data?.message || error.message || "An unexpected error occurred.";

  // Load modifiers
  const loadModifiers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchModifiers();
      setModifiers(data);
    } catch (error) {
      console.error("Failed to load modifiers:", error);
      showToast("error", "Error", getErrorMessage(error));
      setModifiers([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load on mount
  useEffect(() => {
    loadModifiers();
  }, [loadModifiers]);

  // CRUD handlers
  const handleAdd = useCallback(() => {
    setSelectedModifier(null);
    setFormModal(true);
  }, []);

  const handleEdit = useCallback((modifier) => {
    setSelectedModifier(modifier);
    setFormModal(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormModal(false);
    setSelectedModifier(null);
  }, []);

  const handleSave = useCallback(
    async (formData) => {
      setSaving(true);
      try {
        if (selectedModifier) {
          await updateModifier(selectedModifier.modifier_id, formData);
          showToast("success", "Success", "Modifier updated successfully");
        } else {
          await createModifier(formData);
          showToast("success", "Success", "Modifier created successfully");
        }
        handleCloseForm();
        await loadModifiers();
      } catch (error) {
        console.error("Failed to save modifier:", error);
        showToast("error", "Error", getErrorMessage(error));
      } finally {
        setSaving(false);
      }
    },
    [selectedModifier, loadModifiers, handleCloseForm, showToast]
  );

  const handleDeleteClick = useCallback((modifier) => {
    setSelectedModifier(modifier);
    setDeleteDialog(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteDialog(false);
    setSelectedModifier(null);
  }, []);

  const handleConfirmDelete = useCallback(
    async (modifier) => {
      if (!modifier) return;
      setDeleting(true);
      try {
        await deleteModifier(modifier.modifier_id);
        showToast("success", "Success", "Modifier deleted successfully");
        handleCloseDelete();
        await loadModifiers();
      } catch (error) {
        console.error("Failed to delete modifier:", error);
        showToast("error", "Error", getErrorMessage(error));
      } finally {
        setDeleting(false);
      }
    },
    [loadModifiers, handleCloseDelete, showToast]
  );

  const handleToggleStatus = useCallback(
    async (modifier) => {
      // Optimistic update
      setModifiers((prev) =>
        prev.map((m) =>
          m.modifier_id === modifier.modifier_id
            ? { ...m, is_active: !m.is_active }
            : m
        )
      );
      try {
        await toggleModifierStatus(modifier.modifier_id);
        showToast("success", "Success", `Modifier ${modifier.is_active ? "deactivated" : "activated"} successfully`);
      } catch (error) {
        // Revert
        setModifiers((prev) =>
          prev.map((m) =>
            m.modifier_id === modifier.modifier_id
              ? { ...m, is_active: modifier.is_active }
              : m
          )
        );
        showToast("error", "Error", getErrorMessage(error));
      }
    },
    [showToast]
  );

  return (
    <div className="admin-products-container animate-fade-in flex-1 flex flex-col min-h-0">
      <Toast ref={toast} position="top-right" />

      <div className="admin-products-card flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            type="button"
            className="admin-btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4" />
            <span>New Modifier</span>
          </Button>
        </div>

        <AdminModifiersTable
          modifiers={modifiers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <ModifierFormModal
        visible={formModal}
        onHide={handleCloseForm}
        modifier={selectedModifier}
        onSave={handleSave}
        saving={saving}
      />

      <ModifierDeleteDialog
        visible={deleteDialog}
        onHide={handleCloseDelete}
        modifier={selectedModifier}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}

export default AdminModifiersTab;