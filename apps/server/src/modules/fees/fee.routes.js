const express = require('express');
const {
  listFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  archiveFeeStructure,
  listInvoices,
  getInvoiceById,
  createInvoice,
  applyAdjustment,
  exportInvoicesCsv
} = require('./fee.controller');
const { validateFeeStructureInput } = require('./fee.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Fee Structures (Plans)
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT),
  listFeeStructures
);
router.get(
  '/structures',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT),
  listFeeStructures
);
router.get(
  '/structures/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT),
  getFeeStructureById
);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  validateRequest(validateFeeStructureInput),
  createFeeStructure
);

router.post(
  '/structures',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  validateRequest(validateFeeStructureInput),
  createFeeStructure
);

router.put(
  '/structures/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  updateFeeStructure
);

router.patch(
  '/structures/:id/archive',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  archiveFeeStructure
);

// Invoices & Dues
router.get(
  '/invoices',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT),
  listInvoices
);

router.get(
  '/invoices/export',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  exportInvoicesCsv
);

router.get(
  '/invoices/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS, ROLES.STUDENT),
  getInvoiceById
);

router.post(
  '/invoices',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  createInvoice
);

router.post(
  '/invoices/:id/adjustments',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.ACCOUNTS),
  applyAdjustment
);

module.exports = router;
