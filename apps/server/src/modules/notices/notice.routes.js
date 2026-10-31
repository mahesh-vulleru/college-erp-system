const express = require('express');
const {
  listNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  publishNotice,
  archiveNotice
} = require('./notice.controller');
const { validateNoticeInput } = require('./notice.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// View list of circulars and single notice
router.get('/', listNotices);
router.get('/:id', getNoticeById);

// Notice publishing, editing, and archiving restricted to Super Admin, Principal, and HOD
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateNoticeInput),
  createNotice
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateNotice
);

router.patch(
  '/:id/publish',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  publishNotice
);

router.patch(
  '/:id/archive',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  archiveNotice
);

module.exports = router;
