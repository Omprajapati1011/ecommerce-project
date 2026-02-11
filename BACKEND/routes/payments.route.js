// import express from "express";
// import PaymentController from "../controllers/payments.controller.js";
// import { auth } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// /**
//  * @module PaymentRoutes
//  * @description API routes for payment operations.
//  * Base path: /api/payments
//  */

// // POST /api/payments/initiate - Start a new payment (COD or Razorpay)
// router.post("/initiate", authenticate, PaymentController.initiatePayment);

// // POST /api/payments/verify - Verify Razorpay payment after frontend checkout
// router.post("/verify", authenticate, PaymentController.verifyPayment);

// // GET /api/payments/order/:orderId - Get all payments for an order
// router.get("/order/:orderId", authenticate, PaymentController.getPaymentsByOrder);

// // GET /api/payments/:id - Get payment details by ID
// router.get("/:id", authenticate, PaymentController.getPayment);

// // POST /api/payments/:id/refund - Process full or partial refund
// router.post("/:id/refund", authenticate, PaymentController.refundPayment);

// // PUT /api/payments/:id/complete-cod - Mark COD as paid on delivery
// router.put("/:id/complete-cod", authenticate, PaymentController.completeCOD);

// export default router;
