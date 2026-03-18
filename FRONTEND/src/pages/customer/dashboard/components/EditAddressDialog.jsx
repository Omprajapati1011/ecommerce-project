import EditAddressModal from "./EditAddressModal";

function EditAddressDialog({
  form,
  onChange,
  onHide,
  onSubmit,
  updating,
  visible,
}) {
  return (
    <EditAddressModal
      visible={visible}
      form={form}
      updating={updating}
      onHide={onHide}
      onChange={onChange}
      onSubmit={onSubmit}
    />
  );
}

export default EditAddressDialog;
