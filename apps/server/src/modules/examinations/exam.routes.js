const express = require('express');
const {
  listExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam
} = require('./exam.controller');
const {
  configureSeatingPlan,
  getExamSeatingPlans,
  getStudentExamSeating
} = require('./examSeating.controller');
const { validateExamInput } = require('./exam.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

// Seating arrangements
router.post(
  '/seating',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY),
  configureSeatingPlan
);

router.get(
  '/:examinationId/seating',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.PARENT),
  getExamSeatingPlans
);

router.get(
  '/seating/student/:studentId',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT, ROLES.PARENT),
  getStudentExamSeating
);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  listExams
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  getExamById
);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateExamInput),
  createExam
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  updateExam
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  deleteExam
);

module.exports = router;
