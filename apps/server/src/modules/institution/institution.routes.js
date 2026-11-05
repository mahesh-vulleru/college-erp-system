const express = require('express');
const { getProfile, updateProfile, uploadLogo } = require('./institution.controller');
const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

const router = express.Router();

// Require authentication for all institution endpoints
router.use(authenticate);

// View profile: permitted for all authenticated institutional roles
router.get('/profile', getProfile);

// Update profile: restricted strictly to Super Admin
router.put('/profile', authorizeRoles(ROLES.SUPER_ADMIN), updateProfile);

// Upload/change logo: restricted strictly to Super Admin
router.post('/logo', authorizeRoles(ROLES.SUPER_ADMIN), uploadLogo);

module.exports = router;

