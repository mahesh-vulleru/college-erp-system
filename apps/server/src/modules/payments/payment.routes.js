const express = require('express');
const {
  listPayments,
  recordPayment,
  getReceipt,
  processRefund,
  getGatewayStatus
} = require('./payment.controller');
const {
  getReconciliationSummary,
  updatePaymentReconciliation
} = require('./reconciliation.controller');
const { validatePaymentInput } = require('./payment.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Fee Reconciliation & Duplicate Transaction Auditing
router.get(
  '/reconciliation',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  getReconciliationSummary
);

router.patch(
  '/reconciliation/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ACCOUNTS),
  updatePaymentReconciliation
);

// Gateway configuration status check
router.get(
  '/gateway-status',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT),
  getGatewayStatus
);

// List payments
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT),
  listPayments
);

// Get official receipt
router.get(
  '/:id/receipt',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT),
  getReceipt
);

// Record payment (Accounts, Super Admin, Principal, or Student initiating)
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT),
  validateRequest(validatePaymentInput),
  recordPayment
);

// Process refund (Strictly Accounts, Principal, Super Admin)
router.post(
  '/:id/refund',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  processRefund
);

module.exports = router;
