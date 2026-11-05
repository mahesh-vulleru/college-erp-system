const express = require('express');
const {
  listCompanies,
  createCompany,
  listDrives,
  getDriveById,
  createDrive,
  updateDrive,
  applyToDrive,
  getMyApplications,
  getDriveApplications,
  updateApplicationStatus,
  getPlacementAnalytics
} = require('./placement.controller');
const { validateDriveInput, validateCompanyInput } = require('./placement.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Placement Analytics (Institutional overview)
router.get(
  '/analytics',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.STUDENT
  ),
  getPlacementAnalytics
);

// Student Self-Service: My Applications (Strict self-access)
router.get(
  '/my-applications',
  authorizeRoles(ROLES.STUDENT),
  getMyApplications
);

// Companies Catalog
router.get('/companies', listCompanies);
router.post(
  '/companies',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  validateRequest(validateCompanyInput),
  createCompany
);

// Drives
router.get('/drives', listDrives);
router.get('/drives/:id', getDriveById);

router.post(
  '/drives',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  validateRequest(validateDriveInput),
  createDrive
);

router.put(
  '/drives/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  updateDrive
);

// Student 1-Click Application (Self only)
router.post(
  '/drives/:id/apply',
  authorizeRoles(ROLES.STUDENT),
  applyToDrive
);

// Staff Review Candidates
router.get(
  '/drives/:id/applications',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  getDriveApplications
);

// Update Candidate Status / Selection
router.patch(
  '/applications/:id/status',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  updateApplicationStatus
);

module.exports = router;

