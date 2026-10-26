const express = require('express');
const { getTimetable, createTimetableSlot } = require('./timetable.controller');
const { validateTimetableInput } = require('./timetable.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Viewable by all institutional members
router.get('/', getTimetable);

// Slot allocation restricted to HOD, Principal, Super Admin
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateTimetableInput),
  createTimetableSlot
);

module.exports = router;

