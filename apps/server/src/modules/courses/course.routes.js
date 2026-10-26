const express = require('express');
const { listCourses, getCourseById, createCourse } = require('./course.controller');
const { validateCourseInput } = require('./course.validator');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const validateRequest = require('../../middleware/validate');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

router.use(authenticate);

router.get('/', listCourses);
router.get('/:id', getCourseById);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD),
  validateRequest(validateCourseInput),
  createCourse
);

module.exports = router;

