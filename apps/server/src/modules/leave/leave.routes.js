const express = require('express');
const {
  listLeaveRequests,
  getLeaveRequestById,
  applyLeave,
  reviewLeave
} = require('./leave.controller');
const { validateLeaveApplyInput, validateLeaveReviewInput } = require('./leave.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// List leave requests (Faculty: own leaves; HOD: dept leaves; Principal/Super Admin: institutional leaves)
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  listLeaveRequests
);

// Get single leave request
router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getLeaveRequestById
);

// Apply for leave (Faculty)
router.post(
  '/',
  authorizeRoles(ROLES.FACULTY, ROLES.HOD),
  validateRequest(validateLeaveApplyInput),
  applyLeave
);

// Review leave (Approve / Reject) (Principal, Super Admin, HOD)
router.patch(
  '/:id/review',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateLeaveReviewInput),
  reviewLeave
);

module.exports = router;

