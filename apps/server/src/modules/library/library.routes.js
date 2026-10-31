const express = require('express');
const {
  getLibraryDashboard,
  listBooks,
  getBookById,
  createBook,
  updateBook,
  addBookCopies,
  archiveBook,
  listCategories,
  createCategory,
  listMembers,
  registerMember,
  getMemberDetails,
  issueBook,
  returnBook,
  renewBook,
  listIssues,
  listReservations,
  createReservation,
  cancelReservation,
  listFines,
  payFine,
  waiveFine,
  listDigitalResources,
  createDigitalResource,
  recordDownload,
  getLibrarySettings,
  updateLibrarySettings,
  exportLibraryReportCsv
} = require('./library.controller');
const {
  validateBookInput,
  validateCategoryInput,
  validateMemberInput,
  validateIssueInput,
  validateReturnInput,
  validateFineWaiveInput,
  validateDigitalResourceInput
} = require('./library.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// 1. Dashboard summary
router.get(
  '/dashboard',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
  getLibraryDashboard
);

// 2. Books Catalog
router.get(
  '/books',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
  listBooks
);
router.get(
  '/books/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
  getBookById
);
router.post(
  '/books',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  validateRequest(validateBookInput),
  createBook
);
router.put(
  '/books/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  updateBook
);
router.post(
  '/books/:id/copies',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  addBookCopies
);
router.delete(
  '/books/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  archiveBook
);

// 3. Categories
router.get(
  '/categories',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
  listCategories
);
router.post(
  '/categories',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  validateRequest(validateCategoryInput),
  createCategory
);

// 4. Members
router.get(
  '/members',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
  listMembers
);
router.post(
  '/members',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  validateRequest(validateMemberInput),
  registerMember
);
router.get(
  '/members/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.FACULTY, ROLES.STUDENT),
  getMemberDetails
);

// 5. Circulation
router.post(
  '/issues',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  validateRequest(validateIssueInput),
  issueBook
);
router.get(
  '/issues',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
  listIssues
);
router.post(
  '/returns',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  validateRequest(validateReturnInput),
  returnBook
);
router.post(
  '/renewals',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.FACULTY, ROLES.STUDENT),
  renewBook
);

// 6. Reservations
router.get(
  '/reservations',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
  listReservations
);
router.post(
  '/reservations',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.FACULTY, ROLES.STUDENT),
  createReservation
);
router.delete(
  '/reservations/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  cancelReservation
);

// 7. Fines
router.get(
  '/fines',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.ACCOUNTS),
  listFines
);
router.post(
  '/fines/pay',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.ACCOUNTS),
  payFine
);
router.post(
  '/fines/waive',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  validateRequest(validateFineWaiveInput),
  waiveFine
);

// 8. Digital Resources
router.get(
  '/digital-resources',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
  listDigitalResources
);
router.post(
  '/digital-resources',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  validateRequest(validateDigitalResourceInput),
  createDigitalResource
);
router.post(
  '/digital-resources/:id/download',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
  recordDownload
);

// 9. Settings
router.get(
  '/settings',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
  getLibrarySettings
);
router.put(
  '/settings',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  updateLibrarySettings
);

// 10. Reports
router.get(
  '/reports',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
  exportLibraryReportCsv
);

module.exports = router;

