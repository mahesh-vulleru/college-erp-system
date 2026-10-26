const express = require('express');
const { listNotices, createNotice } = require('./notice.controller');
const { validateNoticeInput } = require('./notice.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

router.get('/', listNotices);

// Notice publishing restricted to Super Admin, Principal, and HOD
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateNoticeInput),
  createNotice
);

module.exports = router;

