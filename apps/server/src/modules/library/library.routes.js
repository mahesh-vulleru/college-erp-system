const express = require('express');
const {
  getLibraryDashboard,
<<<<<<< HEAD
=======
  getStaffDashboard,
  getMyTransactions,
  listLibraryStaff,
  createOrAssignLibraryStaff,
  updateLibraryStaffStatus,
  resetLibraryStaffPassword,
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
  getLibraryDashboard
);
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
  getLibraryDashboard
);
router.get(
  '/staff-dashboard',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
  getStaffDashboard
);
router.get(
  '/my-transactions',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
  getMyTransactions
);
>>>>>>> feature/library-staff-portal

// 2. Books Catalog
router.get(
  '/books',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
  listBooks
);
router.get(
  '/books/:id',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.FACULTY, ROLES.STUDENT),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, ROLES.FACULTY, ROLES.STUDENT),
>>>>>>> feature/library-staff-portal
  getMemberDetails
);

// 5. Circulation
router.post(
  '/issues',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
  validateRequest(validateIssueInput),
  issueBook
);
router.get(
  '/issues',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
  listIssues
);
router.post(
  '/returns',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
  validateRequest(validateReturnInput),
  returnBook
);
router.post(
  '/renewals',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.FACULTY, ROLES.STUDENT),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, ROLES.FACULTY, ROLES.STUDENT),
>>>>>>> feature/library-staff-portal
  renewBook
);

// 6. Reservations
router.get(
  '/reservations',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
  listReservations
);
router.post(
  '/reservations',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.FACULTY, ROLES.STUDENT),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, ROLES.FACULTY, ROLES.STUDENT),
>>>>>>> feature/library-staff-portal
  createReservation
);
router.delete(
  '/reservations/:id',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
  cancelReservation
);

// 7. Fines
router.get(
  '/fines',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.ACCOUNTS),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, ROLES.ACCOUNTS),
>>>>>>> feature/library-staff-portal
  listFines
);
router.post(
  '/fines/pay',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.ACCOUNTS),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF, ROLES.ACCOUNTS),
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
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
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
  recordDownload
);

// 9. Settings
router.get(
  '/settings',
<<<<<<< HEAD
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN),
=======
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.LIBRARIAN, ROLES.LIBRARY_STAFF),
>>>>>>> feature/library-staff-portal
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

<<<<<<< HEAD
=======
// 11. Staff Management (Librarian / Super Admin only)
router.get(
  '/staff',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  listLibraryStaff
);
router.post(
  '/staff',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  createOrAssignLibraryStaff
);
router.patch(
  '/staff/:id/status',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  updateLibraryStaffStatus
);
router.post(
  '/staff/:id/reset-password',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.LIBRARIAN),
  resetLibraryStaffPassword
);

>>>>>>> feature/library-staff-portal
module.exports = router;

