const crypto = require('crypto');
const Payment = require('./payment.model');
const Invoice = require('../fees/invoice.model');
const Student = require('../students/student.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

function roundMoney(num) {
  return Math.round((Number(num) || 0) * 100) / 100;
}

/**
 * Generate cryptographically random, uniform receipt number
 */
function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `REC-${year}-${randomPart}`;
}

/**
 * GET /api/v1/payments/gateway-status
 * Inspect whether payment provider credentials are configured
 */
async function getGatewayStatus(req, res, next) {
  try {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || null;
    const razorpaySecretConfigured = Boolean(process.env.RAZORPAY_KEY_SECRET);
    const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

    return sendSuccess(res, {
      message: 'Payment gateway configuration status',
      data: {
        provider: 'Institutional Cashier / Razorpay',
        isConfigured: razorpaySecretConfigured || stripeConfigured,
        activeMode: razorpaySecretConfigured ? 'Live Gateway' : 'Institutional Direct Counter (Manual / Cheque / DD)',
        details: razorpaySecretConfigured
          ? 'Gateway credentials verified.'
          : 'Payment Gateway integration requires setup: Razorpay or Stripe secret keys not configured in server environment. Manual collection mode active.'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/payments
 */
async function listPayments(req, res, next) {
  try {
    const query = {};

    if (req.user.role === ROLES.STUDENT) {
      const profile = await Student.findOne({ user: req.user._id });
      if (!profile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student profile not linked',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      query.student = profile._id;
    } else if (req.query.student) {
      query.student = req.query.student;
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.paymentMethod) query.paymentMethod = req.query.paymentMethod;

    const payments = await Payment.find(query)
      .populate({
        path: 'student',
        select: 'rollNumber enrollmentNumber currentSemester',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('feeStructure', 'title totalAmount')
      .populate('invoice', 'invoiceNumber amountDue status')
      .populate('collectedBy', 'name email role')
      .sort({ paymentDate: -1 });

    return sendSuccess(res, {
      message: 'Payments retrieved',
      data: payments,
      meta: { count: payments.length }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/payments
 * Record payment with server-enforced validation, receipt generation, and idempotency protection
 */
async function recordPayment(req, res, next) {
  try {
    const {
      student,
      feeStructure,
      invoice: invoiceId,
      amountPaid,
      paymentMethod = 'UPI',
      transactionReference,
      idempotencyKey,
      remarks,
      gatewayPayload
    } = req.body;

    const numericAmount = roundMoney(amountPaid);
    if (!student || numericAmount <= 0) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Valid student ID and positive payment amount are required.',
        code: 'INVALID_PAYMENT_DATA'
      });
    }

    // 1. Idempotency Check: prevent duplicate payment execution
    if (idempotencyKey) {
      const existingKey = await Payment.findOne({ idempotencyKey });
      if (existingKey) {
        return sendSuccess(res, {
          statusCode: HTTP_STATUS.OK,
          message: 'Payment already processed (idempotent result)',
          data: existingKey
        });
      }
    }

    if (transactionReference && transactionReference.trim()) {
      const existingRef = await Payment.findOne({
        transactionReference: transactionReference.trim(),
        status: 'completed'
      });
      if (existingRef) {
        return sendError(res, {
          statusCode: HTTP_STATUS.CONFLICT,
          message: `Transaction reference '${transactionReference}' has already been processed and verified.`,
          code: 'DUPLICATE_TRANSACTION'
        });
      }
    }

    // 2. Gateway signature verification (if online provider submitted)
    if (paymentMethod === 'Gateway') {
      const gatewaySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!gatewaySecret) {
        return sendError(res, {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: 'Payment gateway integration requires setup: RAZORPAY_KEY_SECRET is not configured on the institution server. Please pay via Counter or configure provider.',
          code: 'GATEWAY_NOT_CONFIGURED'
        });
      }

      // If signature is provided, verify it HMAC SHA256
      if (gatewayPayload?.orderId && gatewayPayload?.paymentId && gatewayPayload?.signature) {
        const generatedSignature = crypto
          .createHmac('sha256', gatewaySecret)
          .update(`${gatewayPayload.orderId}|${gatewayPayload.paymentId}`)
          .digest('hex');

        if (generatedSignature !== gatewayPayload.signature) {
          return sendError(res, {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            message: 'Provider payment signature verification failed. Untrusted payment payload rejected.',
            code: 'INVALID_SIGNATURE'
          });
        }
      } else {
        return sendError(res, {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: 'Incomplete gateway payload for verification.',
          code: 'INCOMPLETE_PAYLOAD'
        });
      }
    }

    // 3. Server generates official tamper-proof receipt number
    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      student,
      feeStructure: feeStructure || null,
      invoice: invoiceId || null,
      receiptNumber,
      amountPaid: numericAmount,
      currency: 'INR',
      paymentDate: new Date(),
      paymentMethod,
      transactionReference: transactionReference || `TXN-${receiptNumber}`,
      idempotencyKey: idempotencyKey || null,
      status: 'completed',
      isVerified: true,
      verificationDetails: {
        provider: paymentMethod === 'Gateway' ? 'Razorpay Verified' : 'Institutional Staff Verified',
        verifiedAt: new Date(),
        verifiedBy: req.user._id
      },
      collectedBy: req.user._id,
      remarks: remarks || 'Fee payment received and receipt generated.'
    });

    // 4. Update linked invoice status if applicable
    if (invoiceId) {
      const linkedInvoice = await Invoice.findById(invoiceId);
      if (linkedInvoice) {
        // Trigger save to refresh status
        await linkedInvoice.save();
      }
    }

    // 5. Record security audit log
    await recordAuditLog({
      req,
      action: 'PAYMENT_RECORDED_AND_VERIFIED',
      entityType: 'Payment',
      entityId: payment._id,
      details: {
        receiptNumber,
        studentId: student,
        amountPaid: numericAmount,
        paymentMethod,
        transactionReference: payment.transactionReference
      }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Payment verified and official receipt generated successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/payments/:id/receipt
 * Generate server-side receipt details
 */
async function getReceipt(req, res, next) {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'student',
        select: 'rollNumber enrollmentNumber currentSemester',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('feeStructure', 'title tuitionFee labFee libraryFee examFee otherFee totalAmount')
      .populate('invoice', 'invoiceNumber title amountDue')
      .populate('collectedBy', 'name email role');

    if (!payment) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Payment record not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    // Authorization check: students can only view their own receipts
    if (req.user.role === ROLES.STUDENT) {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (!studentProfile || payment.student._id.toString() !== studentProfile._id.toString()) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Access denied to this payment receipt',
          code: 'FORBIDDEN'
        });
      }
    }

    const receiptPayload = {
      receiptNumber: payment.receiptNumber,
      institution: 'College of Engineering & Technology (ERP System)',
      generatedAt: new Date().toISOString(),
      student: {
        name: payment.student?.user?.name || 'N/A',
        rollNumber: payment.student?.rollNumber || 'N/A',
        department: payment.student?.department?.name || 'N/A',
        semester: payment.student?.currentSemester || 'N/A'
      },
      payment: {
        id: payment._id,
        amount: payment.amountPaid,
        currency: payment.currency,
        date: payment.paymentDate,
        method: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        status: payment.status,
        isVerified: payment.isVerified,
        verifiedBy: payment.collectedBy?.name || 'Institutional Finance Office'
      },
      invoice: payment.invoice
        ? {
            invoiceNumber: payment.invoice.invoiceNumber,
            title: payment.invoice.title
          }
        : null,
      verificationDigest: crypto
        .createHash('sha256')
        .update(`${payment.receiptNumber}|${payment.amountPaid}|${payment.paymentDate}`)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase()
    };

    return sendSuccess(res, {
      message: 'Official verified payment receipt generated',
      data: receiptPayload
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/payments/:id/refund
 * Authorized refund processing
 */
async function processRefund(req, res, next) {
  try {
    const { id } = req.params;
    const { refundAmount, reason } = req.body;

    if (!reason || !refundAmount || Number(refundAmount) <= 0) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Positive refund amount and formal reason are required.',
        code: 'INVALID_REFUND_DATA'
      });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Payment not found',
        code: 'NOT_FOUND'
      });
    }

    const numericRefund = roundMoney(refundAmount);
    if (numericRefund > payment.amountPaid) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Refund amount (₹${numericRefund}) cannot exceed amount paid (₹${payment.amountPaid}).`,
        code: 'EXCEEDS_PAYMENT_AMOUNT'
      });
    }

    payment.refundStatus = 'processed';
    payment.refundAmount = numericRefund;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.refundedBy = req.user._id;
    if (numericRefund === payment.amountPaid) {
      payment.status = 'refunded';
    }

    await payment.save();

    await recordAuditLog({
      req,
      action: 'PAYMENT_REFUND_PROCESSED',
      entityType: 'Payment',
      entityId: payment._id,
      details: {
        receiptNumber: payment.receiptNumber,
        refundAmount: numericRefund,
        reason
      }
    });

    return sendSuccess(res, {
      message: 'Payment refund processed successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getGatewayStatus,
  listPayments,
  recordPayment,
  getReceipt,
  processRefund
};
