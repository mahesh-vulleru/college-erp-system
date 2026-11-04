const express = require('express');
const {
  uploadDocument,
  listDocuments,
  getDocumentById,
  recordDownload
} = require('./document.controller');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Upload / register document
router.post(
  '/',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.STUDENT,
    ROLES.ACCOUNTS,
    ROLES.LIBRARIAN,
    ROLES.LIBRARY_STAFF,
    ROLES.PARENT
  ),
  uploadDocument
);

// List documents (scoped by role inside controller)
router.get(
  '/',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.STUDENT,
    ROLES.ACCOUNTS,
    ROLES.LIBRARIAN,
    ROLES.LIBRARY_STAFF,
    ROLES.PARENT
  ),
  listDocuments
);

// Get single document
router.get(
  '/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.STUDENT,
    ROLES.ACCOUNTS,
    ROLES.LIBRARIAN,
    ROLES.LIBRARY_STAFF,
    ROLES.PARENT
  ),
  getDocumentById
);

// Record download
router.post(
  '/:id/download',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.STUDENT,
    ROLES.ACCOUNTS,
    ROLES.LIBRARIAN,
    ROLES.LIBRARY_STAFF,
    ROLES.PARENT
  ),
  recordDownload
);

module.exports = router;

