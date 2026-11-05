const express = require('express');
const {
  listAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  addMaintenanceRecord
} = require('./asset.controller');
const { validateAssetInput } = require('./asset.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Permitted institutional roles can view asset catalog
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS, ROLES.LIBRARIAN),
  listAssets
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ACCOUNTS, ROLES.LIBRARIAN),
  getAssetById
);

// Asset mutations restricted to Super Admin, Accounts, and Chief Librarian
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ACCOUNTS, ROLES.LIBRARIAN),
  validateRequest(validateAssetInput),
  createAsset
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ACCOUNTS, ROLES.LIBRARIAN),
  updateAsset
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ACCOUNTS),
  deleteAsset
);

router.post(
  '/:id/maintenance',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ACCOUNTS, ROLES.LIBRARIAN),
  addMaintenanceRecord
);

module.exports = router;

