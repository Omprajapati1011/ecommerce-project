import PaymentModel from "../models/payments.model.js";
import { syncOrderPaymentStatus } from "../models/Order_master.model.js";
import { getOrderById, updateOrderStatusWithTransition } from "../models/Order_master.model.js";
import {
  ok,
  created,
  badRequest,
  notFound,
  serverError,
} from "../utils/apiResponse.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let Stripe = null;

try {
  Stripe = require("stripe");
} catch (error) {
  Stripe = null;
}

const getStripeClient = () => {
  if (!Stripe) {
    return {
      client: null,
      error:
        "Stripe dependency is missing. Install it with: npm install stripe",
    };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      client: null,
      error: "STRIPE_SECRET_KEY is not configured in environment variables",
    };
  }

  return {
    client: new Stripe(process.env.STRIPE_SECRET_KEY),
    error: null,
  };
};

const canAccessOrder = (req, order) =>
  Boolean(order) &&
  (req.user?.role === "admin" || Number(order.user_id) === Number(req.user?.id));

const canAccessPayment = async (req, payment) => {
  if (!payment) {
    return false;
  }

  const order = await getOrderById(payment.order_id);
  return canAccessOrder(req, order);
};

const applyStripeSessionStatus = async (payment, session, actorId = null) => {
  const paymentIntent = session?.payment_intent;
  const paymentIntentId =
    typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
  const checkoutStatus = String(session?.payment_status || "").toLowerCase();
  const gatewayResponse = {
    stripe_checkout_session_id: session?.id || null,
    stripe_payment_intent_id: paymentIntentId || null,
    stripe_status: checkoutStatus || session?.status || null,
    verified: checkoutStatus === "paid",
  };

  if (checkoutStatus === "paid") {
    await PaymentModel.updateStatus(payment.payment_id, "completed");
    await syncOrderPaymentStatus(payment.order_id, "completed", actorId);
    await PaymentModel.updateGatewayResponse(payment.payment_id, gatewayResponse);
    return {
      ok: true,
      status: "completed",
      payment: await PaymentModel.findById(payment.payment_id),
    };
  }

  if (["unpaid", "no_payment_required"].includes(checkoutStatus)) {
    await PaymentModel.updateGatewayResponse(payment.payment_id, {
      ...gatewayResponse,
      verified: false,
    });
    return {
      ok: false,
      status: checkoutStatus || "processing",
    };
  }

  await PaymentModel.updateGatewayResponse(payment.payment_id, {
    ...gatewayResponse,
    verified: false,
  });
  return {
    ok: false,
    status: checkoutStatus || "processing",
  };
};

// /**
//  * @module PaymentController
//  * @description Handles HTTP requests for payment operations.
//  * Supports COD and Stripe payment methods.
//  */
const PaymentController = {
  //   /**
  //    * POST /api/payments/initiate
  //    * @description Start a new payment (COD or Stripe).
  //    * For COD: creates a pending payment record.
  //    * For Stripe: creates a PaymentIntent and returns client_secret.
  //    */
  async initiatePayment(req, res) {
    try {
      const {
        order_id,
        amount,
        payment_method,
        currency = "INR",
        success_url,
        cancel_url,
      } = req.body;
      const parsedOrderId = Number.parseInt(order_id, 10);
      const parsedAmount = Number(amount);

      //       // Validate required fields
      if (!order_id || !amount || !payment_method) {
        return badRequest(
          res,
          "Order, amount, and payment method are required.",
        );
      }

      //       // Validate payment method
      if (!["cash_on_delivery", "stripe"].includes(payment_method)) {
        return badRequest(
          res,
          "Please choose a valid payment method.",
        );
      }

      // Validate order id for MySQL INT range
      if (
        !Number.isInteger(parsedOrderId) ||
        parsedOrderId <= 0 ||
        parsedOrderId > 2147483647
      ) {
        return badRequest(
          res,
          "We could not identify that order. Please refresh and try again.",
        );
      }

      const order = await getOrderById(parsedOrderId);
      if (!canAccessOrder(req, order)) {
        return notFound(res, "Order not found");
      }

      // //       // Validate amount
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return badRequest(res, "Amount must be greater than 0");
      }

      // //       // --- COD ---
      if (payment_method === "cash_on_delivery") {
        const result = await PaymentModel.create({
          order_id: parsedOrderId,
          payment_method: "cash_on_delivery",
          amount: parsedAmount,
          currency,
          status: "pending",
        });

        const payment = await PaymentModel.findById(result.insertId);

        return created(res, "COD payment initiated. Pay on delivery.", {
          payment,
          payment_type: "cod",
        });
      }

      //       // --- Stripe ---
      const { client: stripe, error: stripeError } = getStripeClient();
      if (!stripe) {
        return badRequest(res, stripeError);
      }

      if (!success_url || !cancel_url) {
        return badRequest(
          res,
          "Stripe checkout could not start because the return URLs are missing.",
        );
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url,
        cancel_url,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Order #${parsedOrderId}`,
              },
              unit_amount: Math.round(parsedAmount * 100),
            },
          },
        ],
        metadata: {
          order_id: parsedOrderId.toString(),
        },
      });

      const result = await PaymentModel.create({
        order_id: parsedOrderId,
        payment_method: "stripe",
        amount: parsedAmount,
        currency,
        transaction_id: checkoutSession.id,
        status: "processing",
        payment_details: {
          stripe_checkout_session_id: checkoutSession.id,
        },
      });

      await PaymentModel.updateStatus(result.insertId, "processing");
      const payment = await PaymentModel.findById(result.insertId);

      return created(res, "Stripe checkout session created.", {
        payment,
        payment_type: "stripe",
        checkout_url: checkoutSession.url,
        stripe_session_id: checkoutSession.id,
        stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
        amount: Math.round(parsedAmount * 100),
        currency: currency.toLowerCase(),
      });
    } catch (error) {
      console.error("Initiate payment error:", error);
      return serverError(res, "Failed to initiate payment");
    }
  },

  //   /**
  //    * POST /api/payments/verify
  //    * @description Verify Stripe payment after frontend checkout.
  //    * Retrieves the PaymentIntent from Stripe and checks its status.
  //    */
  async verifyPayment(req, res) {
    try {
      const { payment_intent_id, session_id } = req.body;

      if (!payment_intent_id && !session_id) {
        return badRequest(res, "session_id or payment_intent_id is required");
      }

      const lookupTransactionId = session_id || payment_intent_id;
      const payment = await PaymentModel.findByTransactionId(lookupTransactionId);

      if (!payment) {
        return notFound(res, "Payment record not found");
      }

      if (!(await canAccessPayment(req, payment))) {
        return notFound(res, "Payment record not found");
      }

      const { client: stripe, error: stripeError } = getStripeClient();
      if (!stripe) {
        return badRequest(res, stripeError);
      }

      if (session_id) {
        const session = await stripe.checkout.sessions.retrieve(session_id, {
          expand: ["payment_intent"],
        });

        const result = await applyStripeSessionStatus(
          payment,
          session,
          req.user?.id,
        );

        if (result.ok) {
          return ok(res, "Payment verified successfully", result.payment);
        }

        return badRequest(
          res,
          "We could not confirm the payment yet. Please wait a moment and check again.",
        );
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

      if (paymentIntent.status === "succeeded") {
        //         // Payment succeeded - mark as completed
        await PaymentModel.updateStatus(payment.payment_id, "completed");
        await syncOrderPaymentStatus(payment.order_id, "completed", req.user?.id);
        await PaymentModel.updateGatewayResponse(payment.payment_id, {
          stripe_payment_intent_id: paymentIntent.id,
          stripe_payment_method: paymentIntent.payment_method,
          stripe_status: paymentIntent.status,
          verified: true,
        });

        const updatedPayment = await PaymentModel.findById(payment.payment_id);
        return ok(res, "Payment verified successfully", updatedPayment);
      }

      if (
        paymentIntent.status === "requires_payment_method" ||
        paymentIntent.status === "canceled"
      ) {
        //         // Payment failed
        await PaymentModel.updateStatus(payment.payment_id, "failed");
        await syncOrderPaymentStatus(payment.order_id, "failed", req.user?.id);
        await PaymentModel.updateGatewayResponse(payment.payment_id, {
          stripe_payment_intent_id: paymentIntent.id,
          stripe_status: paymentIntent.status,
          error: paymentIntent.last_payment_error?.message || "Payment failed",
          verified: false,
        });

        return badRequest(
          res,
          "We could not confirm the payment. Please try again or use another payment method.",
        );
      }

      //       // Payment is still in progress (e.g., "processing", "requires_action")
      await PaymentModel.updateGatewayResponse(payment.payment_id, {
        stripe_payment_intent_id: paymentIntent.id,
        stripe_status: paymentIntent.status,
        verified: false,
      });

      return ok(
        res,
        "Your payment is still being processed.",
        {
          status: paymentIntent.status,
          requires_action: paymentIntent.status === "requires_action",
        },
      );
    } catch (error) {
      console.error("Verify payment error:", error);
      return serverError(res, "Failed to verify payment");
    }
  },

  // //   /**
  // //    * GET /api/payments/:id
  // //    * @description Get a single payment by its ID.
  // //    */
  async getPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await PaymentModel.findById(parseInt(id));

      if (!payment || !(await canAccessPayment(req, payment))) {
        return notFound(res, "Payment not found");
      }

      return ok(res, "Payment fetched successfully", payment);
    } catch (error) {
      console.error("Get payment error:", error);
      return serverError(res, "Internal server error");
    }
  },

  // //   /**
  // //    * GET /api/payments/order/:orderId
  // //    * @description Get all payment attempts for a given order.
  // //    */
  async getPaymentsByOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await getOrderById(parseInt(orderId, 10));

      if (!canAccessOrder(req, order)) {
        return notFound(res, "Payments not found");
      }

      const payments = await PaymentModel.findByOrderId(parseInt(orderId));

      return ok(res, "Payments fetched successfully", payments);
    } catch (error) {
      console.error("Get payments by order error:", error);
      return serverError(res, "Internal server error");
    }
  },

  //   /**
  //    * POST /api/payments/:id/refund
  //    * @description Process a full or partial refund.
  //    * For Stripe: calls Stripe refund API.
  //    * For COD: marks as refunded (manual process).
  //    */
  async refundPayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      const payment = await PaymentModel.findById(parseInt(id));

      if (!payment) {
        return notFound(res, "Payment not found");
      }

      if (payment.is_refunded) {
        return badRequest(res, "Payment already refunded");
      }

      if (payment.status !== "completed") {
        return badRequest(res, "Can only refund completed payments");
      }

      // Use provided amount or full payment amount
      const refundAmount = amount || payment.amount;

      if (refundAmount > payment.amount) {
        return badRequest(res, "Refund amount cannot exceed payment amount");
      }

      //       // Stripe refund
      if (payment.payment_method === "stripe") {
        const { client: stripe, error: stripeError } = getStripeClient();
        if (!stripe) {
          return badRequest(res, stripeError);
        }

        let gatewayData = {};
        try {
          gatewayData = JSON.parse(payment.gateway_response || "{}");
        } catch (e) {
          gatewayData = {};
        }

        if (!gatewayData.stripe_payment_intent_id) {
          return badRequest(
            res,
            "We could not start the refund for this payment.",
          );
        }

        const refund = await stripe.refunds.create({
          payment_intent: gatewayData.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100),
          reason: "requested_by_customer",
          metadata: {
            reason_detail: reason || "Customer requested refund",
          },
        });

        await PaymentModel.processRefund(payment.payment_id, refundAmount);
        await syncOrderPaymentStatus(payment.order_id, "refunded", req.user?.id);
        await PaymentModel.updateGatewayResponse(payment.payment_id, {
          ...gatewayData,
          refund_id: refund.id,
          refund_status: refund.status,
          refund_amount: refundAmount,
        });
      }

      // COD refund (just mark it)
      if (payment.payment_method === "cash_on_delivery") {
        await PaymentModel.processRefund(payment.payment_id, refundAmount);
        await syncOrderPaymentStatus(payment.order_id, "refunded", req.user?.id);
      }

      const updatedPayment = await PaymentModel.findById(payment.payment_id);

      return ok(
        res,
        `Refund of ${refundAmount} processed successfully`,
        updatedPayment,
      );
    } catch (error) {
      console.error("Refund payment error:", error);
      return serverError(res, "Failed to process refund");
    }
  },

  // //   /**
  // //    * PUT /api/payments/:id/complete-cod
  // //    * @description Mark a COD payment as completed when order is delivered.
  // //    */
  async completeCOD(req, res) {
    try {
      const { id } = req.params;
      const payment = await PaymentModel.findById(parseInt(id));

      if (!payment) {
        return notFound(res, "Payment not found");
      }

      if (payment.payment_method !== "cash_on_delivery") {
        return badRequest(res, "This endpoint is only for COD payments");
      }

      if (payment.status === "completed") {
        return badRequest(res, "Payment already completed");
      }

      await PaymentModel.completeCODPayment(payment.payment_id);
      await syncOrderPaymentStatus(payment.order_id, "completed", req.user?.id);
      const updatedPayment = await PaymentModel.findById(payment.payment_id);

      return ok(res, "COD payment marked as completed", updatedPayment);
    } catch (error) {
      console.error("Complete COD error:", error);
      return serverError(res, "Internal server error");
    }
  },

  async cancelStripeCheckout(req, res) {
    try {
      const { session_id } = req.body;

      if (!session_id) {
        return badRequest(res, "session_id is required");
      }

      const payment = await PaymentModel.findByTransactionId(session_id);
      if (!payment || !(await canAccessPayment(req, payment))) {
        return notFound(res, "Payment not found");
      }

      if (["completed", "refunded"].includes(String(payment.status).toLowerCase())) {
        return badRequest(res, "This payment can no longer be cancelled");
      }

      await PaymentModel.updateStatus(payment.payment_id, "failed");
      await syncOrderPaymentStatus(payment.order_id, "failed", req.user?.id);

      const order = await getOrderById(payment.order_id);
      if (order && String(order.order_status).toLowerCase() === "pending") {
        await updateOrderStatusWithTransition(
          payment.order_id,
          "cancelled",
          req.user?.id,
          req.user?.role === "admin" ? null : req.user?.id,
        );
      }

      await PaymentModel.updateGatewayResponse(payment.payment_id, {
        stripe_checkout_session_id: session_id,
        stripe_status: "cancelled",
        verified: false,
      });

      return ok(res, "Stripe checkout cancelled successfully", {
        payment: await PaymentModel.findById(payment.payment_id),
      });
    } catch (error) {
      console.error("Cancel Stripe checkout error:", error);
      return serverError(res, "Failed to cancel Stripe checkout");
    }
  },

  //   /**
  //    * POST /api/payments/webhook
  //    * @description Handle Stripe webhook events for async payment updates.
  //    * Verifies the webhook signature and processes the event.
  //    */
  async handleWebhook(req, res) {
    const { client: stripe, error: stripeError } = getStripeClient();
    if (!stripe) {
      return badRequest(res, stripeError);
    }

    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const payment = await PaymentModel.findByTransactionId(session.id);
        if (payment && payment.status !== "completed") {
          await applyStripeSessionStatus(payment, session);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const payment = await PaymentModel.findByTransactionId(session.id);
        if (payment && !["completed", "failed", "refunded"].includes(payment.status)) {
          await PaymentModel.updateStatus(payment.payment_id, "failed");
          await syncOrderPaymentStatus(payment.order_id, "failed");
          await PaymentModel.updateGatewayResponse(payment.payment_id, {
            stripe_checkout_session_id: session.id,
            stripe_status: "expired",
            verified: false,
            webhook_event_id: event.id,
          });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(
          `payment_intent.succeeded received for ${paymentIntent.id}; checkout.session.completed will finalize order state.`,
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const payment = await PaymentModel.findByTransactionId(
          paymentIntent.id,
        );
        if (payment && payment.status !== "failed") {
          await PaymentModel.updateStatus(payment.payment_id, "failed");
          await syncOrderPaymentStatus(payment.order_id, "failed");
          await PaymentModel.updateGatewayResponse(payment.payment_id, {
            stripe_payment_intent_id: paymentIntent.id,
            stripe_status: paymentIntent.status,
            error:
              paymentIntent.last_payment_error?.message || "Payment failed",
            webhook_event_id: event.id,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  },
};

export default PaymentController;
