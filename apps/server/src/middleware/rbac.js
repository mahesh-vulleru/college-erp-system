const { HTTP_STATUS, ROLE_PERMISSIONS } = require('@college-erp/shared');

/**
 * Role-Based Access Control Middleware (Role check)
 * @param  {...string} allowedRoles
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required before checking role authorization.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' does not have permission to access this resource.`,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}

/**
 * Permission-Based Access Control Middleware
 * @param  {...string} requiredPermissions
 */
function requirePermissions(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required before checking permissions.'
      });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Forbidden: Insufficient permissions for this action.',
        requiredPermissions
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles,
  requirePermissions
};
