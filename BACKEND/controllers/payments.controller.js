// import PaymentModel from "../models/payments.model.js";
// import { ok, created, badRequest, notFound, serverError } from "../utils/apiResponse.js";
// import Razorpay from "razorpay";
// import crypto from "crypto";

// /** Razorpay instance - initialized from env credentials */
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// /**
//  * @module PaymentController
//  * @description Handles HTTP requests for payment operations.
//  * Supports COD and Razorpay payment methods.
//  */
// const PaymentController = {
//   /**
//    * POST /api/payments/initiate
//    * @description Start a new payment (COD or Razorpay).
//    * For COD: creates a pending payment record.
//    * For Razorpay: creates a Razorpay order and returns checkout data.
//    */
//   async initiatePayment(req, res) {
//     try {
//       const { order_id, amount, payment_method, currency = "INR" } = req.body;

//       // Validate required fields
//       if (!order_id || !amount || !payment_method) {
//         return badRequest(res, "order_id, amount, and payment_method are required");
//       }

//       // Validate payment method
//       if (!["cash_on_delivery", "razorpay"].includes(payment_method)) {
//         return badRequest(res, "Invalid payment method. Use: cash_on_delivery or razorpay");
//       }

//       // Validate amount
//       if (amount <= 0) {
//         return badRequest(res, "Amount must be greater than 0");
//       }

//       // --- COD ---
//       if (payment_method === "cash_on_delivery") {
//         const result = await PaymentModel.create({
//           order_id,
//           payment_method: "cash_on_delivery",
//           amount,
//           currency,
//           status: "pending",
//         });

//         const payment = await PaymentModel.findById(result.insertId);

//         return created(res, "COD payment initiated. Pay on delivery.", {
//           payment,
//           payment_type: "cod",
//         });
//       }

//       // --- Razorpay ---
//       const razorpayOrder = await razorpay.orders.create({
//         amount: Math.round(amount * 100), // Razorpay expects paise (1 INR = 100 paise)
//         currency,
//         receipt: `order_${order_id}_${Date.now()}`,
//         notes: { order_id: order_id.toString() },
//       });

//       const result = await PaymentModel.create({
//         order_id,
//         payment_method: "razorpay",
//         amount,
//         currency,
//         transaction_id: razorpayOrder.id,
//         status: "processing",
//         payment_details: { razorpay_order_id: razorpayOrder.id },
//       });

//       await PaymentModel.updateStatus(result.insertId, "processing");
//       const payment = await PaymentModel.findById(result.insertId);

//       return created(res, "Razorpay order created. Complete payment on frontend.", {
//         payment,
//         payment_type: "razorpay",
//         razorpay_order_id: razorpayOrder.id,
//         razorpay_key_id: process.env.RAZORPAY_KEY_ID,
//         amount: razorpayOrder.amount,
//         currency: razorpayOrder.currency,
//       });
//     } catch (error) {
//       console.error("Initiate payment error:", error);
//       return serverError(res, "Failed to initiate payment");
//     }
//   },

//   /**
//    * POST /api/payments/verify
//    * @description Verify Razorpay payment signature after frontend checkout.
//    * Compares HMAC-SHA256 signature to confirm payment authenticity.
//    */
//   async verifyPayment(req, res) {
//     try {
//       const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//       // Validate required fields
//       if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//         return badRequest(res, "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required");
//       }

//       // Generate expected signature using HMAC-SHA256
//       const body = razorpay_order_id + "|" + razorpay_payment_id;
//       const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(body)
//         .digest("hex");

//       // Compare signatures
//       const isValid = expectedSignature === razorpay_signature;

//       // Find payment record by razorpay order ID
//       const payment = await PaymentModel.findByTransactionId(razorpay_order_id);

//       if (!payment) {
//         return notFound(res, "Payment record not found");
//       }

//       if (!isValid) {
//         // Signature mismatch - mark as failed
//         await PaymentModel.updateStatus(payment.payment_id, "failed");
//         await PaymentModel.updateGatewayResponse(payment.payment_id, {
//           error: "Signature verification failed",
//           razorpay_order_id,
//           razorpay_payment_id,
//         });

//         return badRequest(res, "Payment verification failed. Invalid signature.");
//       }

//       // Signature valid - mark as completed
//       await PaymentModel.updateStatus(payment.payment_id, "completed");
//       await PaymentModel.updateGatewayResponse(payment.payment_id, {
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature,
//         verified: true,
//       });

//       const updatedPayment = await PaymentModel.findById(payment.payment_id);

//       return ok(res, "Payment verified successfully", updatedPayment);
//     } catch (error) {
//       console.error("Verify payment error:", error);
//       return serverError(res, "Failed to verify payment");
//     }
//   },

//   /**
//    * GET /api/payments/:id
//    * @description Get a single payment by its ID.
//    */
//   async getPayment(req, res) {
//     try {
//       const { id } = req.params;
//       const payment = await PaymentModel.findById(parseInt(id));

//       if (!payment) {
//         return notFound(res, "Payment not found");
//       }

//       return ok(res, "Payment fetched successfully", payment);
//     } catch (error) {
//       console.error("Get payment error:", error);
//       return serverError(res, "Internal server error");
//     }
//   },

//   /**
//    * GET /api/payments/order/:orderId
//    * @description Get all payment attempts for a given order.
//    */
//   async getPaymentsByOrder(req, res) {
//     try {
//       const { orderId } = req.params;
//       const payments = await PaymentModel.findByOrderId(parseInt(orderId));

//       return ok(res, "Payments fetched successfully", payments);
//     } catch (error) {
//       console.error("Get payments by order error:", error);
//       return serverError(res, "Internal server error");
//     }
//   },

//   /**
//    * POST /api/payments/:id/refund
//    * @description Process a full or partial refund.
//    * For Razorpay: calls Razorpay refund API.
//    * For COD: marks as refunded (manual process).
//    */
//   async refundPayment(req, res) {
//     try {
//       const { id } = req.params;
//       const { amount, reason } = req.body;

//       const payment = await PaymentModel.findById(parseInt(id));

//       if (!payment) {
//         return notFound(res, "Payment not found");
//       }

//       if (payment.is_refunded) {
//         return badRequest(res, "Payment already refunded");
//       }

//       if (payment.status !== "completed") {
//         return badRequest(res, "Can only refund completed payments");
//       }

//       // Use provided amount or full payment amount
//       const refundAmount = amount || payment.amount;

//       if (refundAmount > payment.amount) {
//         return badRequest(res, "Refund amount cannot exceed payment amount");
//       }

//       // Razorpay refund
//       if (payment.payment_method === "razorpay") {
//         let gatewayData = {};
//         try {
//           gatewayData = JSON.parse(payment.gateway_response || "{}");
//         } catch (e) {
//           gatewayData = {};
//         }

//         if (!gatewayData.razorpay_payment_id) {
//           return badRequest(res, "Razorpay payment ID not found. Cannot process refund.");
//         }

//         const refund = await razorpay.payments.refund(gatewayData.razorpay_payment_id, {
//           amount: Math.round(refundAmount * 100),
//           notes: { reason: reason || "Customer requested refund" },
//         });

//         await PaymentModel.processRefund(payment.payment_id, refundAmount);
//         await PaymentModel.updateGatewayResponse(payment.payment_id, {
//           ...gatewayData,
//           refund_id: refund.id,
//           refund_status: refund.status,
//           refund_amount: refundAmount,
//         });
//       }

//       // COD refund (just mark it)
//       if (payment.payment_method === "cash_on_delivery") {
//         await PaymentModel.processRefund(payment.payment_id, refundAmount);
//       }

//       const updatedPayment = await PaymentModel.findById(payment.payment_id);

//       return ok(res, `Refund of ${refundAmount} processed successfully`, updatedPayment);
//     } catch (error) {
//       console.error("Refund payment error:", error);
//       return serverError(res, "Failed to process refund");
//     }
//   },

//   /**
//    * PUT /api/payments/:id/complete-cod
//    * @description Mark a COD payment as completed when order is delivered.
//    */
//   async completeCOD(req, res) {
//     try {
//       const { id } = req.params;
//       const payment = await PaymentModel.findById(parseInt(id));

//       if (!payment) {
//         return notFound(res, "Payment not found");
//       }

//       if (payment.payment_method !== "cash_on_delivery") {
//         return badRequest(res, "This endpoint is only for COD payments");
//       }

//       if (payment.status === "completed") {
//         return badRequest(res, "Payment already completed");
//       }

//       await PaymentModel.completeCODPayment(payment.payment_id);
//       const updatedPayment = await PaymentModel.findById(payment.payment_id);

//       return ok(res, "COD payment marked as completed", updatedPayment);
//     } catch (error) {
//       console.error("Complete COD error:", error);
//       return serverError(res, "Internal server error");
//     }
//   },
// };

// export default PaymentController;
