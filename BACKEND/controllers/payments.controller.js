import PaymentModel from "../models/payments.model.js";
import {
  ok,
  created,
  badRequest,
  notFound,
  serverError,
} from "../utils/apiResponse.js";
import Stripe from "stripe";

/** Stripe instance - initialized from env credentials */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @module PaymentController
 * @description Handles HTTP requests for payment operations.
 * Supports COD and Stripe payment methods.
 */
const PaymentController = {
  /**
   * POST /api/payments/initiate
   * @description Start a new payment (COD or Stripe).
   * For COD: creates a pending payment record.
   * For Stripe: creates a PaymentIntent and returns client_secret.
   */
  async initiatePayment(req, res) {
    try {
      const { order_id, amount, payment_method, currency = "INR" } = req.body;

      // Validate required fields
      if (!order_id || !amount || !payment_method) {
        return badRequest(
          res,
          "order_id, amount, and payment_method are required"
        );
      }

      // Validate payment method
      if (!["cash_on_delivery", "stripe"].includes(payment_method)) {
        return badRequest(
          res,
          "Invalid payment method. Use: cash_on_delivery or stripe"
        );
      }

      // Validate amount
      if (amount <= 0) {
        return badRequest(res, "Amount must be greater than 0");
      }

      // --- COD ---
      if (payment_method === "cash_on_delivery") {
        const result = await PaymentModel.create({
          order_id,
          payment_method: "cash_on_delivery",
          amount,
          currency,
          status: "pending",
        });

        const payment = await PaymentModel.findById(result.insertId);

        return created(res, "COD payment initiated. Pay on delivery.", {
          payment,
          payment_type: "cod",
        });
      }

      // --- Stripe ---
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects smallest currency unit (paise for INR)
        currency: currency.toLowerCase(), // Stripe requires lowercase currency codes
        metadata: {
          order_id: order_id.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      const result = await PaymentModel.create({
        order_id,
        payment_method: "stripe",
        amount,
        currency,
        transaction_id: paymentIntent.id,
        status: "processing",
        payment_details: { stripe_payment_intent_id: paymentIntent.id },
      });

      await PaymentModel.updateStatus(result.insertId, "processing");
      const payment = await PaymentModel.findById(result.insertId);

      return created(
        res,
        "Stripe PaymentIntent created. Complete payment on frontend.",
        {
          payment,
          payment_type: "stripe",
          client_secret: paymentIntent.client_secret,
          stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        }
      );
    } catch (error) {
      console.error("Initiate payment error:", error);
      return serverError(res, "Failed to initiate payment");
    }
  },

  /**
   * POST /api/payments/verify
   * @description Verify Stripe payment after frontend checkout.
   * Retrieves the PaymentIntent from Stripe and checks its status.
   */
  async verifyPayment(req, res) {
    try {
      const { payment_intent_id } = req.body;

      // Validate required fields
      if (!payment_intent_id) {
        return badRequest(res, "payment_intent_id is required");
      }

      // Find payment record by Stripe PaymentIntent ID
      const payment = await PaymentModel.findByTransactionId(payment_intent_id);

      if (!payment) {
        return notFound(res, "Payment record not found");
      }

      // Retrieve the PaymentIntent from Stripe to check its actual status
      const paymentIntent =
        await stripe.paymentIntents.retrieve(payment_intent_id);

      if (paymentIntent.status === "succeeded") {
        // Payment succeeded - mark as completed
        await PaymentModel.updateStatus(payment.payment_id, "completed");
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
        // Payment failed
        await PaymentModel.updateStatus(payment.payment_id, "failed");
        await PaymentModel.updateGatewayResponse(payment.payment_id, {
          stripe_payment_intent_id: paymentIntent.id,
          stripe_status: paymentIntent.status,
          error:
            paymentIntent.last_payment_error?.message || "Payment failed",
          verified: false,
        });

        return badRequest(
          res,
          `Payment verification failed. Status: ${paymentIntent.status}`
        );
      }

      // Payment is still in progress (e.g., "processing", "requires_action")
      await PaymentModel.updateGatewayResponse(payment.payment_id, {
        stripe_payment_intent_id: paymentIntent.id,
        stripe_status: paymentIntent.status,
        verified: false,
      });

      return ok(
        res,
        `Payment is still in progress. Status: ${paymentIntent.status}`,
        {
          status: paymentIntent.status,
          requires_action: paymentIntent.status === "requires_action",
        }
      );
    } catch (error) {
      console.error("Verify payment error:", error);
      return serverError(res, "Failed to verify payment");
    }
  },

  /**
   * GET /api/payments/:id
   * @description Get a single payment by its ID.
   */
  async getPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await PaymentModel.findById(parseInt(id));

      if (!payment) {
        return notFound(res, "Payment not found");
      }

      return ok(res, "Payment fetched successfully", payment);
    } catch (error) {
      console.error("Get payment error:", error);
      return serverError(res, "Internal server error");
    }
  },

  /**
   * GET /api/payments/order/:orderId
   * @description Get all payment attempts for a given order.
   */
  async getPaymentsByOrder(req, res) {
    try {
      const { orderId } = req.params;
      const payments = await PaymentModel.findByOrderId(parseInt(orderId));

      return ok(res, "Payments fetched successfully", payments);
    } catch (error) {
      console.error("Get payments by order error:", error);
      return serverError(res, "Internal server error");
    }
  },

  /**
   * POST /api/payments/:id/refund
   * @description Process a full or partial refund.
   * For Stripe: calls Stripe refund API.
   * For COD: marks as refunded (manual process).
   */
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

      // Stripe refund
      if (payment.payment_method === "stripe") {
        let gatewayData = {};
        try {
          gatewayData = JSON.parse(payment.gateway_response || "{}");
        } catch (e) {
          gatewayData = {};
        }

        if (!gatewayData.stripe_payment_intent_id) {
          return badRequest(
            res,
            "Stripe PaymentIntent ID not found. Cannot process refund."
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
      }

      const updatedPayment = await PaymentModel.findById(payment.payment_id);

      return ok(
        res,
        `Refund of ${refundAmount} processed successfully`,
        updatedPayment
      );
    } catch (error) {
      console.error("Refund payment error:", error);
      return serverError(res, "Failed to process refund");
    }
  },

  /**
   * PUT /api/payments/:id/complete-cod
   * @description Mark a COD payment as completed when order is delivered.
   */
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
      const updatedPayment = await PaymentModel.findById(payment.payment_id);

      return ok(res, "COD payment marked as completed", updatedPayment);
    } catch (error) {
      console.error("Complete COD error:", error);
      return serverError(res, "Internal server error");
    }
  },

  /**
   * POST /api/payments/webhook
   * @description Handle Stripe webhook events for async payment updates.
   * Verifies the webhook signature and processes the event.
   */
  async handleWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const payment = await PaymentModel.findByTransactionId(
          paymentIntent.id
        );
        if (payment && payment.status !== "completed") {
          await PaymentModel.updateStatus(payment.payment_id, "completed");
          await PaymentModel.updateGatewayResponse(payment.payment_id, {
            stripe_payment_intent_id: paymentIntent.id,
            stripe_payment_method: paymentIntent.payment_method,
            stripe_status: paymentIntent.status,
            verified: true,
            webhook_event_id: event.id,
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const payment = await PaymentModel.findByTransactionId(
          paymentIntent.id
        );
        if (payment && payment.status !== "failed") {
          await PaymentModel.updateStatus(payment.payment_id, "failed");
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
