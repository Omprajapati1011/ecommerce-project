import pool from "../configs/db.js";

/**
 * @module PaymentModel
 * @description Database operations for the payment_master table.
 * Handles payment creation, retrieval, status updates, and refunds.
 */
const PaymentModel = {
  /**
   * Create a new payment record.
   * @param {Object} paymentData
   * @param {number} paymentData.order_id - Associated order ID
   * @param {string} paymentData.payment_method - 'cash_on_delivery' | 'razorpay'
   * @param {number} paymentData.amount - Payment amount
   * @param {string} [paymentData.currency='INR'] - ISO currency code
   * @param {string} [paymentData.transaction_id=null] - Gateway transaction ID
   * @param {string} [paymentData.status='pending'] - Initial payment status
   * @param {Object} [paymentData.payment_details=null] - Additional gateway data
   * @returns {Promise<Object>} MySQL insert result { insertId, affectedRows }
   */
  async create(paymentData) {
    const {
      order_id,
      payment_method,
      amount,
      currency = "INR",
      transaction_id = null,
      status = "pending",
      payment_details = null,
    } = paymentData;

    const query = `
      INSERT INTO payment_master
      (order_id, transaction_id, payment_method, amount, currency, status, payment_details, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.execute(query, [
      order_id,
      transaction_id,
      payment_method,
      amount,
      currency,
      status,
      payment_details ? JSON.stringify(payment_details) : null,
    ]);

    return result;
  },

  /**
   * Find a single payment by its ID.
   * @param {number} paymentId - Primary key
   * @returns {Promise<Object|null>} Payment record or null
   */
  async findById(paymentId) {
    const query = `SELECT * FROM payment_master WHERE payment_id = ?`;
    const [rows] = await pool.execute(query, [paymentId]);
    return rows[0] || null;
  },

  /**
   * Find a payment by its gateway transaction ID.
   * Used during Razorpay payment verification.
   * @param {string} transactionId - Razorpay order/transaction ID
   * @returns {Promise<Object|null>} Payment record or null
   */
  async findByTransactionId(transactionId) {
    const query = `SELECT * FROM payment_master WHERE transaction_id = ?`;
    const [rows] = await pool.execute(query, [transactionId]);
    return rows[0] || null;
  },

  /**
   * Find all payments for a given order.
   * Returns multiple records (retries, partial payments).
   * @param {number} orderId - Order ID to look up
   * @returns {Promise<Array>} Array of payment records
   */
  async findByOrderId(orderId) {
    const query = `
      SELECT * FROM payment_master
      WHERE order_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query, [orderId]);
    return rows;
  },

  /**
   * Update payment status with corresponding timestamp.
   * Automatically sets processing_started_at, succeeded_at, or failed_at.
   * @param {number} paymentId - Payment to update
   * @param {string} status - 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
   * @returns {Promise<Object>} MySQL update result { affectedRows, changedRows }
   */
  async updateStatus(paymentId, status) {
    let timestampField = "";

    if (status === "processing") {
      timestampField = ", processing_started_at = NOW()";
    } else if (status === "completed") {
      timestampField = ", succeeded_at = NOW()";
    } else if (status === "failed") {
      timestampField = ", failed_at = NOW()";
    }

    const query = `
      UPDATE payment_master
      SET status = ?, updated_at = NOW() ${timestampField}
      WHERE payment_id = ?
    `;

    const [result] = await pool.execute(query, [status, paymentId]);
    return result;
  },

  /**
   * Set the external transaction ID after gateway order creation.
   * @param {number} paymentId - Payment to update
   * @param {string} transactionId - Gateway transaction/order ID
   * @returns {Promise<Object>} MySQL update result
   */
  async updateTransactionId(paymentId, transactionId) {
    const query = `
      UPDATE payment_master
      SET transaction_id = ?, updated_at = NOW()
      WHERE payment_id = ?
    `;

    const [result] = await pool.execute(query, [transactionId, paymentId]);
    return result;
  },

  /**
   * Store the raw gateway response for debugging and auditing.
   * @param {number} paymentId - Payment to update
   * @param {Object} gatewayResponse - Response object from Razorpay
   * @returns {Promise<Object>} MySQL update result
   */
  async updateGatewayResponse(paymentId, gatewayResponse) {
    const query = `
      UPDATE payment_master
      SET gateway_response = ?, updated_at = NOW()
      WHERE payment_id = ?
    `;

    const [result] = await pool.execute(query, [
      JSON.stringify(gatewayResponse),
      paymentId,
    ]);

    return result;
  },

  /**
   * Mark a payment as refunded (full or partial).
   * @param {number} paymentId - Payment to refund
   * @param {number} refundAmount - Amount to refund
   * @returns {Promise<Object>} MySQL update result
   */
  async processRefund(paymentId, refundAmount) {
    const query = `
      UPDATE payment_master
      SET is_refunded = 1, refund_amount = ?, status = 'refunded', updated_at = NOW()
      WHERE payment_id = ?
    `;

    const [result] = await pool.execute(query, [refundAmount, paymentId]);
    return result;
  },

  /**
   * Mark a COD payment as completed when order is delivered.
   * Only works for cash_on_delivery payment method.
   * @param {number} paymentId - COD payment to complete
   * @returns {Promise<Object>} MySQL update result
   */
  async completeCODPayment(paymentId) {
    const query = `
      UPDATE payment_master
      SET status = 'completed', succeeded_at = NOW(), updated_at = NOW()
      WHERE payment_id = ? AND payment_method = 'cash_on_delivery'
    `;

    const [result] = await pool.execute(query, [paymentId]);
    return result;
  },
};

export default PaymentModel;
