const Payment = require('./payment.model');
const Student = require('../students/student.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');

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

    const payments = await Payment.find(query)
      .populate('student', 'rollNumber')
      .populate('feeStructure', 'title totalAmount')
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

async function recordPayment(req, res, next) {
  try {
    const payment = await Payment.create({
      ...req.body,
      collectedBy: req.user._id
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Payment recorded and receipt generated',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPayments,
  recordPayment
};

