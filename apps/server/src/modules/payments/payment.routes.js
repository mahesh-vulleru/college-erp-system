const express = require('express');
const { listPayments, recordPayment } = require('./payment.controller');
const { validatePaymentInput } = require('./payment.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

router.get('/', listPayments);

// Payment entry restricted to Accounts Officer, Principal, and Super Admin
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  validateRequest(validatePaymentInput),
  recordPayment
);

module.exports = router;

