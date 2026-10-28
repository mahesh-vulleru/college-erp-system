const jwt = require('jsonwebtoken');
const { HTTP_STATUS, ROLES, USER_STATUS } = require('@college-erp/shared');
const env = require('../../config/env');
const User = require('./auth.model');
const logger = require('../../utils/logger');
const { recordAuditLog } = require('../../utils/auditLogger');

function signToken(userId, role) {
  return jwt.sign(
    { id: userId, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

/**
 * POST /api/v1/auth/login
 * Validates user credentials, rejects role mismatches, and enforces account status checks.
 */
async function login(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Explicitly query password since it has select: false
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      logger.warn(`[AUTH_FAILURE] Category: AUTH_USER_NOT_FOUND | Email: ${normalizedEmail}`);
      await recordAuditLog({
        req,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'User',
        outcome: 'failure',
        details: { reason: 'User not found', email: normalizedEmail }
      });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    let isMatch = await user.comparePassword(password);
    if (!isMatch && typeof password === 'string' && password.trim() !== password) {
      isMatch = await user.comparePassword(password.trim());
    }
    if (!isMatch) {
      logger.warn(`[AUTH_FAILURE] Category: AUTH_PASSWORD_MISMATCH | Email: ${normalizedEmail}`);
      await recordAuditLog({
        req,
        user: user._id,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'User',
        entityId: user._id,
        outcome: 'failure',
        details: { reason: 'Password mismatch', email: normalizedEmail }
      });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    // Role mismatch check: verify that the user's registered role matches the selected role
    if (role && user.role !== role) {
      logger.warn(`[AUTH_FAILURE] Category: AUTH_ROLE_MISMATCH | Email: ${normalizedEmail} | StoredRole: ${user.role} | SelectedRole: ${role}`);
      await recordAuditLog({
        req,
        user: user._id,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'User',
        entityId: user._id,
        outcome: 'failure',
        details: { reason: 'Role mismatch', storedRole: user.role, selectedRole: role, email: normalizedEmail }
      });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: `Role mismatch: This account is registered as '${user.role.replace(/_/g, ' ')}', not '${role.replace(/_/g, ' ')}'. Please choose the correct role.`,
        registeredRole: user.role
      });
    }

    // Check account status: reject login if account is disabled or inactive
    if (user.status !== USER_STATUS.ACTIVE) {
      logger.warn(`[AUTH_FAILURE] Category: AUTH_ACCOUNT_INACTIVE | Email: ${normalizedEmail} | Status: ${user.status}`);
      await recordAuditLog({
        req,
        user: user._id,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'User',
        entityId: user._id,
        outcome: 'failure',
        details: { reason: 'Account inactive or disabled', status: user.status, email: normalizedEmail }
      });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Account is ${user.status}. Please contact the institution administrator.`
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id, user.role);

    logger.info(`User logged in successfully: ${user.email} (${user.role})`);

    await recordAuditLog({
      req,
      user: user._id,
      action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user._id,
      outcome: 'success',
      details: { email: user.email, role: user.role }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        isTemporaryPassword: user.isTemporaryPassword || false,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/register
 * Public registration endpoint. Role is strictly locked to Student.
 * Privileged accounts can ONLY be provisioned by Super Admin via /api/v1/users.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role, department } = req.body;

    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'A user account with this email already exists.'
      });
    }

    // Security invariant: never trust client role blindly from public endpoint.
    // If authenticated as Super Admin, honor role; otherwise force ROLES.STUDENT.
    const assignedRole = (req.user && req.user.role === ROLES.SUPER_ADMIN && role)
      ? role
      : ROLES.STUDENT;

    const newUser = await User.create({
      name,
      email: cleanEmail,
      password,
      role: assignedRole,
      department,
      status: USER_STATUS.ACTIVE
    });

    const token = signToken(newUser._id, newUser.role);

    logger.info(`New user registered: ${newUser.email} with role: ${newUser.role}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        status: newUser.status,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile
 */
async function getMe(req, res, next) {
  try {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        status: req.user.status,
        isTemporaryPassword: req.user.isTemporaryPassword || false,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/change-password
 * Allows an authenticated user to change their password and clear temporary status.
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Both current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Current password provided is incorrect.'
      });
    }

    user.password = newPassword;
    user.isTemporaryPassword = false;
    await user.save();

    await recordAuditLog({
      req,
      user: user._id,
      action: 'AUTH_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id,
      outcome: 'success',
      details: { email: user.email }
    });

    logger.info(`Password changed successfully for user: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register,
  getMe,
  changePassword
};
