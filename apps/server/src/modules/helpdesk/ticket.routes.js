const express = require('express');
const {
  createTicket,
  listTickets,
  getTicketById,
  addTicketComment,
  updateTicket
} = require('./ticket.controller');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Submit ticket (All 13 authenticated roles)
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
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT,
    ROLES.PARENT
  ),
  createTicket
);

// List tickets (Role-scoped inside controller)
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
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT,
    ROLES.PARENT
  ),
  listTickets
);

// Get single ticket details
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
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT,
    ROLES.PARENT
  ),
  getTicketById
);

// Add comment to ticket
router.post(
  '/:id/comments',
  authorizeRoles(
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
  ),
  addTicketComment
);

// Update ticket status / assignment (Super Admin, Principal, HOD, Accounts, Librarian, Transport Admin)
router.patch(
  '/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.HOD,
    ROLES.ACCOUNTS,
    ROLES.LIBRARIAN,
    ROLES.TRANSPORT_ADMIN
  ),
  updateTicket
);

module.exports = router;

