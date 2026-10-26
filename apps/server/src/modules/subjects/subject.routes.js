const express = require('express');
const { listSubjects, createSubject } = require('./subject.controller');
const { validateSubjectInput } = require('./subject.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

router.get('/', listSubjects);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateSubjectInput),
  createSubject
);

module.exports = router;

