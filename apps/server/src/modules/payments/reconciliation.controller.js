const mongoose = require('mongoose');
const Payment = require('./payment.model');
const Invoice = require('../fees/invoice.model');
const Student = require('../students/student.model');
const { ROLES, HTTP_STATUS } = require('@college-erp/shared');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Get fee reconciliation summary, detects duplicates and invoice mismatches
 * (Accounts, Super Admin, Principal)
 */
async function getReconciliationSummary(req, res, next) {
  try {
    const { startDate, endDate, status } = req.query;

    const query = {};
    if (status && status !== 'all') query.reconciliationStatus = status;

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate({
        path: 'student',
        select: 'rollNumber enrollmentNumber user department',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('invoice', 'invoiceNumber totalAmount status')
      .populate('reconciledBy', 'name email role')
      .sort({ paymentDate: -1 })
      .lean();

    const payList = Array.isArray(payments) ? payments : [];

    // 1. Compute totals
    const totalPaymentsCount = payList.length;
    const totalCollectedAmount = payList.reduce((acc, curr) => acc + (Number(curr.amountPaid) || 0), 0);

    const reconciledList = payList.filter((p) => p.reconciliationStatus === 'reconciled');
    const reconciledAmount = reconciledList.reduce((acc, curr) => acc + (Number(curr.amountPaid) || 0), 0);

    const pendingList = payList.filter((p) => p.reconciliationStatus === 'pending');
    const pendingAmount = pendingList.reduce((acc, curr) => acc + (Number(curr.amountPaid) || 0), 0);

    // 2. Anomaly Detection: Duplicate transactions
    const duplicates = [];
    const txRefMap = {};
    const studentAmountMap = {};

    payList.forEach((p) => {
      if (p.transactionReference && p.transactionReference !== 'N/A') {
        const refKey = String(p.transactionReference).trim().toUpperCase();
        if (txRefMap[refKey]) {
          duplicates.push({
            type: 'duplicate_reference',
            receiptNumber: p.receiptNumber,
            conflictingReceipt: txRefMap[refKey].receiptNumber,
            reference: refKey,
            amount: p.amountPaid,
            studentRoll: p.student?.rollNumber,
            message: `Duplicate transaction reference "${refKey}" on receipts ${p.receiptNumber} and ${txRefMap[refKey].receiptNumber}`
          });
        } else {
          txRefMap[refKey] = p;
        }
      }

      const sId = p.student?._id?.toString() || 'unknown';
      let pDate = 'recent';
      if (p.paymentDate && !isNaN(new Date(p.paymentDate).getTime())) {
        pDate = new Date(p.paymentDate).toISOString().split('T')[0];
      }
      const saKey = `${sId}_${p.amountPaid}_${pDate}`;

      if (studentAmountMap[saKey]) {
        duplicates.push({
          type: 'duplicate_amount_date',
          receiptNumber: p.receiptNumber,
          conflictingReceipt: studentAmountMap[saKey].receiptNumber,
          amount: p.amountPaid,
          studentRoll: p.student?.rollNumber,
          date: pDate,
          message: `Identical amount ₹${p.amountPaid} for student ${p.student?.rollNumber} paid on the same date (${pDate})`
        });
      } else {
        studentAmountMap[saKey] = p;
      }
    });

    // 3. Anomaly Detection: Invoice mismatches
    const mismatches = [];
    payList.forEach((p) => {
      if (p.invoice && p.invoice.totalAmount !== undefined) {
        if (p.amountPaid > p.invoice.totalAmount) {
          mismatches.push({
            receiptNumber: p.receiptNumber,
            invoiceNumber: p.invoice.invoiceNumber,
            paidAmount: p.amountPaid,
            invoiceAmount: p.invoice.totalAmount,
            discrepancy: p.amountPaid - p.invoice.totalAmount,
            message: `Overpayment: Paid ₹${p.amountPaid} exceeds invoice total ₹${p.invoice.totalAmount}`
          });
        }
      }
    });

    return sendSuccess(res, {
      message: 'Fee reconciliation summary retrieved',
      data: {
        metrics: {
          totalPaymentsCount,
          totalCollectedAmount,
          reconciledCount: reconciledList.length,
          reconciledAmount,
          pendingCount: pendingList.length,
          pendingAmount,
          flaggedDuplicatesCount: duplicates.length,
          mismatchesCount: mismatches.length
        },
        duplicates,
        mismatches,
        transactions: payList.slice(0, 100).map((p) => ({
          id: p._id,
          receiptNumber: p.receiptNumber,
          studentName: p.student?.user?.name || 'Student',
          rollNumber: p.student?.rollNumber || 'N/A',
          amountPaid: p.amountPaid,
          paymentMethod: p.paymentMethod,
          transactionReference: p.transactionReference || 'N/A',
          paymentDate: p.paymentDate,
          status: p.status,
          reconciliationStatus: p.reconciliationStatus,
          reconciledBy: p.reconciledBy?.name,
          reconciliationNotes: p.reconciliationNotes,
          invoiceNumber: p.invoice?.invoiceNumber || 'Direct'
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching reconciliation summary:', error);
    next(error);
  }
}

/**
 * Update reconciliation status for a payment transaction
 * (Accounts, Super Admin)
 */
async function updatePaymentReconciliation(req, res, next) {
  try {
    const { id } = req.params;
    const { reconciliationStatus, reconciliationNotes } = req.body;

    if (!['pending', 'reconciled', 'mismatched', 'flagged_duplicate'].includes(reconciliationStatus)) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Invalid status. Must be pending, reconciled, mismatched, or flagged_duplicate.'
      });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Payment record not found.'
      });
    }

    payment.reconciliationStatus = reconciliationStatus;
    payment.reconciledBy = req.user._id;
    payment.reconciledAt = new Date();
    if (reconciliationNotes !== undefined) payment.reconciliationNotes = reconciliationNotes;

    await payment.save();

    return sendSuccess(res, {
      message: `Transaction ${reconciliationStatus} successfully`,
      data: payment
    });
  } catch (error) {
    logger.error('Error updating reconciliation:', error);
    next(error);
  }
}

module.exports = {
  getReconciliationSummary,
  updatePaymentReconciliation
};
