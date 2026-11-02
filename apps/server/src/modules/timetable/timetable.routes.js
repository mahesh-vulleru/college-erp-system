const express = require('express');
const {
  getTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot
} = require('./timetable.controller');
const { validateTimetableInput } = require('./timetable.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Readable by all authenticated institutional users (Super Admin, Principal, HOD, Faculty, Student)
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getTimetable
);

// Management restricted to Super Admin, Principal, and HOD
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateTimetableInput),
  createTimetableSlot
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateTimetableSlot
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  deleteTimetableSlot
);

module.exports = router;
