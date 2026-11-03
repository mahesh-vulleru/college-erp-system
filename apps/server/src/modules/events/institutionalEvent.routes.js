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

const createEventRouter = (options = {}) => {
  const router = express.Router();
  router.use(authenticate);

  // If allowAllRead is true (for /calendar and /events), any authenticated role can view
  const readRoles = options.allowAllRead
    ? [
        ROLES.SUPER_ADMIN,
        ROLES.PRINCIPAL,
        ROLES.HOD,
        ROLES.FACULTY,
        ROLES.STUDENT,
        ROLES.ACCOUNTS,
        ROLES.LIBRARIAN,
        ROLES.LIBRARY_STAFF,
        ROLES.TRANSPORT_ADMIN,
        ROLES.TRANSPORT_SUPERVISOR,
        ROLES.BUS_DRIVER,
        ROLES.BUS_ATTENDANT,
        ROLES.PARENT
      ]
    : [
        ROLES.SUPER_ADMIN,
        ROLES.PRINCIPAL,
        ROLES.HOD,
        ROLES.FACULTY,
        ROLES.TRANSPORT_ADMIN
      ];

  // 1. Summary metrics for dashboard
  router.get(
    '/summary',
    authorizeRoles(...readRoles),
    getEventsSummary
  );

  // 2. Events & Deadlines list with calendar & filter queries
  router.get(
    '/',
    authorizeRoles(...readRoles),
    listEvents
  );

  // 3. Single event details
  router.get(
    '/:id',
    authorizeRoles(...readRoles),
    getEventById
  );

  // 4. Create event / deadline (Principal, Super Admin, HOD, Transport Admin)
  router.post(
    '/',
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.TRANSPORT_ADMIN),
    validateRequest(validateInstitutionalEventInput),
    createEvent
  );

  // 5. Update event
  router.put(
    '/:id',
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.TRANSPORT_ADMIN),
    updateEvent
  );

  // 6. Delete event (Principal, Super Admin, Transport Admin)
  router.delete(
    '/:id',
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.TRANSPORT_ADMIN),
    deleteEvent
  );

  // 7. Mark event as completed
  router.patch(
    '/:id/complete',
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.TRANSPORT_ADMIN),
    markEventCompleted
  );

  return router;
};

const institutionalEventRoutes = createEventRouter({ allowAllRead: false });
institutionalEventRoutes.calendarRouter = createEventRouter({ allowAllRead: true });
institutionalEventRoutes.createEventRouter = createEventRouter;

module.exports = institutionalEventRoutes;

