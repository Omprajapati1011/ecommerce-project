import { Dialog } from "primereact/dialog";
import OrderDetailComponents from "./OrderDetailComponents";

function OrderDetailsDialog({
  onHide,
  selectedOrder,
  visible,
  showToast,
}) {
  return (
    <Dialog
      header={null}
      showHeader={false}
      closable={false}
      visible={visible}
       onHide={onHide}
      style={{ width: "min(1100px, 95vw)" }}
      breakpoints={{ "960px": "95vw", "640px": "100vw" }}
      modal
      draggable={false}
      resizable={false}
      className="order-detail-dialog"
    >
      {selectedOrder && (
        <OrderDetailComponents
          orderId={selectedOrder.order_id}
          orderData={selectedOrder}
          onClose={onHide}
          isDialog
          showToast={showToast}
        />
      )}
    </Dialog>
  );
}

export default OrderDetailsDialog;
