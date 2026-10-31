const FeeStructure = require('./fee.model');
const Invoice = require('./invoice.model');
const Payment = require('../payments/payment.model');
const Student = require('../students/student.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

/**
 * Decimal-safe round helper to 2 decimal places
 */
function roundMoney(num) {
  return Math.round((Number(num) || 0) * 100) / 100;
}

/**
 * Server-side calculation of invoice balances from persisted records
 */
async function computeInvoiceBalance(invoiceDoc) {
  const inv = invoiceDoc.toObject ? invoiceDoc.toObject() : { ...invoiceDoc };

  // Calculate total positive adjustments (waiver, scholarship, discount) vs penalties
  const adjustments = inv.adjustments || [];
  let totalWaivers = 0;
  for (const adj of adjustments) {
    if (['waiver', 'scholarship', 'discount'].includes(adj.type)) {
      totalWaivers += Number(adj.amount) || 0;
    } else if (['penalty'].includes(adj.type)) {
      totalWaivers -= Number(adj.amount) || 0;
    }
  }
  totalWaivers = roundMoney(Math.max(0, totalWaivers));

  // Fetch verified payments linked to this invoice or student + feeStructure
  const paymentQuery = {
    $or: [
      { invoice: inv._id },
      ...(inv.feeStructure ? [{ student: inv.student?._id || inv.student, feeStructure: inv.feeStructure }] : [])
    ],
    status: { $in: ['completed', 'refunded'] }
  };

  const payments = await Payment.find(paymentQuery);

  let totalVerifiedPayments = 0;
  let totalRefunds = 0;

  for (const p of payments) {
    if (p.status === 'completed' || p.isVerified) {
      totalVerifiedPayments += Number(p.amountPaid) || 0;
    }
    if (p.refundStatus === 'processed' || p.refundStatus === 'approved') {
      totalRefunds += Number(p.refundAmount) || 0;
    }
  }

  totalVerifiedPayments = roundMoney(totalVerifiedPayments);
  totalRefunds = roundMoney(totalRefunds);

  const netPayments = Math.max(0, totalVerifiedPayments - totalRefunds);
  const amountDue = roundMoney(inv.amountDue);
  const outstandingBalance = roundMoney(Math.max(0, amountDue - totalWaivers - netPayments));

  let derivedStatus = 'unpaid';
  if (amountDue > 0 && totalWaivers >= amountDue) {
    derivedStatus = 'waived';
  } else if (outstandingBalance <= 0) {
    derivedStatus = 'paid';
  } else if (netPayments > 0) {
    derivedStatus = 'partial';
  }

  return {
    ...inv,
    amountDue,
    totalWaivers,
    totalVerifiedPayments: netPayments,
    totalRefunds,
    outstandingBalance,
    derivedStatus
  };
}

// -------------------------------------------------------------
// FEE STRUCTURES (Fee Plans)
// -------------------------------------------------------------

async function listFeeStructures(req, res, next) {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.semester) query.semester = parseInt(req.query.semester, 10);
    if (req.query.academicYear) query.academicYear = req.query.academicYear;
    if (req.query.status) {
      query.status = req.query.status;
    } else {
      // By default exclude archived plans unless explicitly requested
      query.status = { $ne: 'archived' };
    }
    if (req.query.feeCategory) query.feeCategory = req.query.feeCategory;

    const fees = await FeeStructure.find(query)
      .populate('department', 'name code')
      .sort({ academicYear: -1, semester: 1 });

    return sendSuccess(res, {
      message: 'Fee structures retrieved',
      data: fees,
      meta: { count: fees.length }
    });
  } catch (error) {
    next(error);
  }
}

async function getFeeStructureById(req, res, next) {
  try {
    const fee = await FeeStructure.findById(req.params.id).populate('department', 'name code');
    if (!fee) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Fee structure plan not found',
        code: 'NOT_FOUND'
      });
    }

    return sendSuccess(res, {
      message: 'Fee structure details retrieved',
      data: fee
    });
  } catch (error) {
    next(error);
  }
}

async function createFeeStructure(req, res, next) {
  try {
    const fee = await FeeStructure.create(req.body);

    await recordAuditLog({
      req,
      action: 'FEE_STRUCTURE_CREATED',
      entityType: 'FeeStructure',
      entityId: fee._id,
      details: {
        title: fee.title,
        academicYear: fee.academicYear,
        semester: fee.semester,
        totalAmount: fee.totalAmount
      }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Fee structure created successfully',
      data: fee
    });
  } catch (error) {
    next(error);
  }
}

async function updateFeeStructure(req, res, next) {
  try {
    const fee = await FeeStructure.findById(req.params.id);
    if (!fee) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Fee structure plan not found',
        code: 'NOT_FOUND'
      });
    }

    const updatable = [
      'title',
      'department',
      'academicYear',
      'semester',
      'feeCategory',
      'currency',
      'effectiveDate',
      'status',
      'tuitionFee',
      'labFee',
      'libraryFee',
      'examFee',
      'otherFee',
      'dueDate'
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        fee[field] = req.body[field];
      }
    });

    await fee.save();

    await recordAuditLog({
      req,
      action: 'FEE_STRUCTURE_UPDATED',
      entityType: 'FeeStructure',
      entityId: fee._id,
      details: { title: fee.title, totalAmount: fee.totalAmount, status: fee.status }
    });

    return sendSuccess(res, {
      message: 'Fee structure updated successfully',
      data: fee
    });
  } catch (error) {
    next(error);
  }
}

async function archiveFeeStructure(req, res, next) {
  try {
    const fee = await FeeStructure.findById(req.params.id);
    if (!fee) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Fee structure plan not found',
        code: 'NOT_FOUND'
      });
    }

    fee.status = 'archived';
    await fee.save();

    await recordAuditLog({
      req,
      action: 'FEE_STRUCTURE_ARCHIVED',
      entityType: 'FeeStructure',
      entityId: fee._id,
      details: { title: fee.title }
    });

    return sendSuccess(res, {
      message: 'Fee structure archived successfully',
      data: fee
    });
  } catch (error) {
    next(error);
  }
}

// -------------------------------------------------------------
// INVOICES & STUDENT DUES
// -------------------------------------------------------------

async function listInvoices(req, res, next) {
  try {
    const query = {};

    // Role-based scoping: Students only see their own invoices
    if (req.user.role === ROLES.STUDENT) {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (!studentProfile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Student record not linked to active account',
          code: 'STUDENT_RECORD_NOT_FOUND'
        });
      }
      query.student = studentProfile._id;
    } else {
      if (req.query.student) query.student = req.query.student;
      if (req.query.semester) query.semester = parseInt(req.query.semester, 10);
      if (req.query.academicYear) query.academicYear = req.query.academicYear;
      if (req.query.status) query.status = req.query.status;
      if (req.query.feeCategory) query.feeCategory = req.query.feeCategory;
    }

    const invoices = await Invoice.find(query)
      .populate({
        path: 'student',
        select: 'rollNumber enrollmentNumber currentSemester',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('feeStructure', 'title totalAmount')
      .sort({ dueDate: -1, createdAt: -1 });

    // Compute live balance for each invoice
    const calculatedInvoices = await Promise.all(
      invoices.map((inv) => computeInvoiceBalance(inv))
    );

    // Summary metrics
    const summary = calculatedInvoices.reduce(
      (acc, inv) => {
        acc.totalInvoiced += inv.amountDue;
        acc.totalWaivers += inv.totalWaivers;
        acc.totalCollected += inv.totalVerifiedPayments;
        acc.totalOutstanding += inv.outstandingBalance;
        return acc;
      },
      { totalInvoiced: 0, totalWaivers: 0, totalCollected: 0, totalOutstanding: 0 }
    );

    summary.totalInvoiced = roundMoney(summary.totalInvoiced);
    summary.totalWaivers = roundMoney(summary.totalWaivers);
    summary.totalCollected = roundMoney(summary.totalCollected);
    summary.totalOutstanding = roundMoney(summary.totalOutstanding);

    return sendSuccess(res, {
      message: 'Student invoices and dues retrieved',
      data: calculatedInvoices,
      meta: {
        count: calculatedInvoices.length,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getInvoiceById(req, res, next) {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({
        path: 'student',
        select: 'rollNumber enrollmentNumber currentSemester',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('feeStructure', 'title totalAmount tuitionFee labFee libraryFee examFee otherFee')
      .populate('adjustments.approvedBy', 'name email role');

    if (!invoice) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Invoice not found',
        code: 'NOT_FOUND'
      });
    }

    // Role check for students
    if (req.user.role === ROLES.STUDENT) {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (!studentProfile || invoice.student._id.toString() !== studentProfile._id.toString()) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Access denied to this student invoice',
          code: 'FORBIDDEN'
        });
      }
    }

    const calculated = await computeInvoiceBalance(invoice);

    // Also get all verified payment transactions for this invoice
    const payments = await Payment.find({
      $or: [
        { invoice: invoice._id },
        ...(invoice.feeStructure ? [{ student: invoice.student._id, feeStructure: invoice.feeStructure }] : [])
      ]
    })
      .populate('collectedBy', 'name email role')
      .sort({ paymentDate: -1 });

    return sendSuccess(res, {
      message: 'Invoice details retrieved',
      data: {
        ...calculated,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createInvoice(req, res, next) {
  try {
    const {
      student,
      feeStructure,
      feeCategory = 'composite',
      title,
      academicYear,
      semester,
      amountDue,
      dueDate,
      notes
    } = req.body;

    if (!student || !amountDue || !dueDate) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Student, amountDue, and dueDate are mandatory fields.',
        code: 'MISSING_FIELDS'
      });
    }

    const studentRecord = await Student.findById(student);
    if (!studentRecord) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      student,
      feeStructure: feeStructure || null,
      feeCategory,
      title: title || `Tuition & Term Fee - Sem ${semester || studentRecord.currentSemester}`,
      academicYear: academicYear || '2025-2026',
      semester: semester || studentRecord.currentSemester,
      amountDue: roundMoney(amountDue),
      dueDate: new Date(dueDate),
      notes,
      createdBy: req.user._id
    });

    await recordAuditLog({
      req,
      action: 'INVOICE_GENERATED',
      entityType: 'Invoice',
      entityId: invoice._id,
      details: {
        invoiceNumber,
        studentId: student,
        amountDue: invoice.amountDue,
        dueDate: invoice.dueDate
      }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Student invoice generated successfully',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

async function applyAdjustment(req, res, next) {
  try {
    const { id } = req.params;
    const { type, amount, reason } = req.body;

    if (!type || !amount || !reason) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Adjustment type, amount, and justification reason are required.',
        code: 'MISSING_FIELDS'
      });
    }

    const numericAmount = roundMoney(amount);
    if (numericAmount <= 0) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Adjustment amount must be greater than zero.',
        code: 'INVALID_AMOUNT'
      });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Invoice not found',
        code: 'NOT_FOUND'
      });
    }

    // Check outstanding balance before applying waiver
    const currentStatus = await computeInvoiceBalance(invoice);
    if (['waiver', 'scholarship', 'discount'].includes(type) && numericAmount > currentStatus.outstandingBalance) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `Adjustment amount (₹${numericAmount}) cannot exceed the current outstanding balance (₹${currentStatus.outstandingBalance}).`,
        code: 'ADJUSTMENT_EXCEEDS_BALANCE'
      });
    }

    invoice.adjustments.push({
      type,
      amount: numericAmount,
      reason,
      approvedBy: req.user._id,
      date: new Date()
    });

    await invoice.save();

    const updated = await computeInvoiceBalance(invoice);
    invoice.status = updated.derivedStatus;
    await invoice.save();

    await recordAuditLog({
      req,
      action: 'FEE_ADJUSTMENT_APPLIED',
      entityType: 'Invoice',
      entityId: invoice._id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        type,
        amount: numericAmount,
        reason,
        remainingBalance: updated.outstandingBalance
      }
    });

    return sendSuccess(res, {
      message: `Fee ${type} applied successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function exportInvoicesCsv(req, res, next) {
  try {
    const query = {};
    if (req.query.academicYear) query.academicYear = req.query.academicYear;
    if (req.query.semester) query.semester = parseInt(req.query.semester, 10);

    const invoices = await Invoice.find(query)
      .populate({
        path: 'student',
        select: 'rollNumber',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .sort({ createdAt: -1 });

    const calculated = await Promise.all(invoices.map((inv) => computeInvoiceBalance(inv)));

    const headers = [
      'Invoice Number',
      'Student Name',
      'Roll Number',
      'Department',
      'Semester',
      'Academic Year',
      'Amount Due (INR)',
      'Waivers/Adjustments (INR)',
      'Verified Payments (INR)',
      'Outstanding Balance (INR)',
      'Payment Status',
      'Due Date'
    ];

    const rows = calculated.map((inv) => [
      inv.invoiceNumber,
      `"${(inv.student?.user?.name || '').replace(/"/g, '""')}"`,
      inv.student?.rollNumber || '',
      inv.student?.department?.code || '',
      inv.semester,
      inv.academicYear,
      inv.amountDue.toFixed(2),
      inv.totalWaivers.toFixed(2),
      inv.totalVerifiedPayments.toFixed(2),
      inv.outstandingBalance.toFixed(2),
      inv.derivedStatus,
      inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices-ledger.csv"');
    return res.status(HTTP_STATUS.OK).send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  archiveFeeStructure,
  listInvoices,
  getInvoiceById,
  createInvoice,
  applyAdjustment,
  exportInvoicesCsv,
  computeInvoiceBalance
};
