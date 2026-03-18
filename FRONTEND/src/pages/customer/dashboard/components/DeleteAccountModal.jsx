import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import { Message } from "primereact/message";

function DeleteAccountModal({ loading, onConfirm, onHide, visible }) {
  const footer = (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        label="Cancel"
        icon="pi pi-times"
        outlined
        onClick={onHide}
        disabled={loading}
        className="!w-full !rounded-xl sm:!w-auto"
      />
      <Button
        label={loading ? "Deleting..." : "Delete Account"}
        icon="pi pi-trash"
        severity="danger"
        onClick={onConfirm}
        disabled={loading}
        className="!w-full !rounded-xl sm:!w-auto"
      />
    </div>
  );

  return (
    <Dialog
      header="Confirm Account Deletion"
      className="!overflow-hidden"
      visible={visible}
      style={{ width: "92vw", maxWidth: "520px" }}
      onHide={onHide}
      footer={footer}
      dismissableMask={!loading}
      closable={!loading}
    >
      <div className="mb-2 flex items-center gap-2 text-red-700 dark:text-red-300">
        <i className="pi pi-exclamation-triangle" />
        <p className="text-sm font-medium">This operation cannot be undone.</p>
      </div>
      <Divider className="!my-3" />
      <Message
        severity="warn"
        text="This action is permanent. Your account and related data will be removed."
        className="w-full"
      />
    </Dialog>
  );
}

export default DeleteAccountModal;
