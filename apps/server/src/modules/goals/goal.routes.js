const express = require('express');
const {
  listGoals,
  getGoalsSummary,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  recordGoalProgress
} = require('./goal.controller');
const {
  validateGoalInput,
  validateProgressRecordInput
} = require('./goal.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// 1. Summary metrics
router.get(
  '/summary',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getGoalsSummary
);

// 2. Goals list with filters & search
router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  listGoals
);

// 3. Single goal details
router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  getGoalById
);

// 4. Create goal (Principal, Super Admin)
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  validateRequest(validateGoalInput),
  createGoal
);

// 5. Update goal
router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateGoal
);

// 6. Delete goal (Principal, Super Admin)
router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL),
  deleteGoal
);

// 7. Record progress update
router.post(
  '/:id/progress',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  validateRequest(validateProgressRecordInput),
  recordGoalProgress
);

module.exports = router;

