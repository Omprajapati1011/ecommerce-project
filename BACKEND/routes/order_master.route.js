import express from "express";
const orderRouter = express.Router();
import {
  Order_master,
  AllOrder,
  changeOrderStatusByAdmin,
  changePaymentStatusByAdmin,
  deleteOrder,
  cancelOrder,
  requestCancelOrderByUser,
  returnOrderByUser,
  getAllItemsAdmin,
  getAllOrderByAdmin,
  getOrderDetailByAdmin,
  getAllItemsByCountAdmin,
  getOrderSummery,
  getCancelRequestsByAdmin,
  reviewCancelRequestByAdmin,
} from "../controllers/Order_master.controller.js";
import { auth, adminOnly } from "../middlewares/auth.middleware.js";

orderRouter.post("/make-order", auth, Order_master);
orderRouter.get("/user-allorder", auth, AllOrder);
orderRouter.get("/order-summery", auth, getOrderSummery);
orderRouter.patch(
  "/changestatus/:id",
  auth,
  adminOnly,
  changeOrderStatusByAdmin,
);
orderRouter.patch(
  "/paymentstatus/:id",
  auth,
  adminOnly,
  changePaymentStatusByAdmin,
);
orderRouter.delete("/deleteorder/:id", auth, adminOnly, deleteOrder);
orderRouter.delete("/cancelorder/:id", auth, cancelOrder);
orderRouter.post("/:id/cancel-request", auth, requestCancelOrderByUser);
orderRouter.patch("/returnorder/:id", auth, returnOrderByUser);
orderRouter.get("/allorder", auth, adminOnly, getAllOrderByAdmin);
orderRouter.get("/admin/orders", auth, adminOnly, getAllOrderByAdmin);
orderRouter.get("/admin/orders/:id", auth, adminOnly, getOrderDetailByAdmin);
orderRouter.get(
  "/admin/cancel-requests",
  auth,
  adminOnly,
  getCancelRequestsByAdmin,
);
orderRouter.patch(
  "/admin/cancel-requests/:id",
  auth,
  adminOnly,
  reviewCancelRequestByAdmin,
);
orderRouter.patch(
  "/admin/orders/:id/payment-status",
  auth,
  adminOnly,
  changePaymentStatusByAdmin,
);
orderRouter.get("/all-itemsby-count", auth, adminOnly, getAllItemsByCountAdmin);
orderRouter.get("/all-items", auth, adminOnly, getAllItemsAdmin);

// New admin endpoints — paginated orders with full details

export default orderRouter;
