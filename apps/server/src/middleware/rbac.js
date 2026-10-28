const { HTTP_STATUS, ROLE_PERMISSIONS } = require('@college-erp/shared');

/**
 * Normalizes role string for robust comparison: trims, lowercases, replaces spaces/dashes with underscores
 * e.g. "Principal" -> "principal", "Super Administrator" -> "super_admin"
 */
function normalizeRole(role) {
  const str = String(role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (str === 'super_administrator' || str === 'superadmin') return 'super_admin';
  return str;
}

/**
 * Role-Based Access Control Middleware (Role check)
 * Supports both rest arguments and arrays, e.g. authorizeRoles('super_admin', 'principal') or authorizeRoles(['super_admin', 'principal'])
 * @param  {...string|string[]} allowedRoles
 */
function authorizeRoles(...allowedRoles) {
  const rawRoles = allowedRoles.flat(Infinity);
  const normalizedAllowed = rawRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required before checking role authorization.'
      });
    }

    const userRole = normalizeRole(req.user.role);
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' does not have permission to access this resource.`,
        requiredRoles: rawRoles
      });
    }

    next();
  };
}

/**
 * Permission-Based Access Control Middleware
 * @param  {...string|string[]} requiredPermissions
 */
function requirePermissions(...requiredPermissions) {
  const reqPerms = requiredPermissions.flat(Infinity);

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required before checking permissions.'
      });
    }

    const userRole = normalizeRole(req.user.role);
    const userPermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[req.user.role] || [];
    const hasAll = reqPerms.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Forbidden: Insufficient permissions for this action.',
        requiredPermissions: reqPerms
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles,
  requirePermissions
};
