const express = require('express');
const {
  listLeaveRequests,
  getLeaveRequestById,
  applyLeave,
  reviewLeave,
  escalateLeave,
  getWorkflowConfig,
  updateWorkflowConfig
} = require('./leave.controller');
const { validateLeaveApplyInput, validateLeaveReviewInput } = require('./leave.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Workflow configuration endpoints
router.get('/config', getWorkflowConfig);
router.put('/config', authorizeRoles(ROLES.SUPER_ADMIN), updateWorkflowConfig);

// List leave requests (role-based scoped in controller)
router.get(
  '/',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.STUDENT,
    ROLES.LIBRARIAN,
    ROLES.LIBRARY_STAFF,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  listLeaveRequests
);

// Get single leave request
router.get(
  '/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.STUDENT,
    ROLES.LIBRARIAN,
    ROLES.LIBRARY_STAFF,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  getLeaveRequestById
);

// Apply for leave (All authenticated institutional & transport roles)
router.post(
  '/',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.STUDENT,
    ROLES.LIBRARIAN,
    ROLES.LIBRARY_STAFF,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  validateRequest(validateLeaveApplyInput),
  applyLeave
);

// Review leave (Approve / Reject) (Designated approvers)
router.patch(
  '/:id/review',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.FACULTY,
    ROLES.LIBRARIAN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  validateRequest(validateLeaveReviewInput),
  reviewLeave
);

// Escalate leave request to higher authority
router.post(
  '/:id/escalate',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.LIBRARIAN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  escalateLeave
);

module.exports = router;
