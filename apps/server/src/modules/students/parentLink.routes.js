const express = require('express');
const {
  listMyChildren,
  createParentLink,
  listParentLinks,
  updateParentLink,
  deleteParentLink
} = require('./parentLink.controller');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Parent view: my verified children
router.get(
  '/my-children',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.PARENT),
  listMyChildren
);

// Administrative CRUD: Manage parent-student linkages
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  listParentLinks
);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  createParentLink
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  updateParentLink
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  deleteParentLink
);

module.exports = router;

