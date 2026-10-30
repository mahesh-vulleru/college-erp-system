const express = require('express');
const {
  listEvents,
  getEventsSummary,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  markEventCompleted
} = require('./institutionalEvent.controller');
const {
  validateInstitutionalEventInput
} = require('./institutionalEvent.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// 1. Summary metrics for dashboard
router.get(
  '/summary',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getEventsSummary
);

// 2. Events & Deadlines list with calendar & filter queries
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  listEvents
);

// 3. Single event details
router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getEventById
);

// 4. Create event / deadline (Principal, Super Admin, HOD)
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateInstitutionalEventInput),
  createEvent
);

// 5. Update event
router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateEvent
);

// 6. Delete event (Principal, Super Admin)
router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  deleteEvent
);

// 7. Mark event as completed
router.patch(
  '/:id/complete',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  markEventCompleted
);

module.exports = router;

