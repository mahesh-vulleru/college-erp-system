const jwt = require('jsonwebtoken');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const env = require('../../config/env');
const User = require('./auth.model');
const logger = require('../../utils/logger');

function signToken(userId, role) {
  return jwt.sign(
    { id: userId, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Explicitly query password since it has select: false
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id, user.role);

    logger.info(`User logged in successfully: ${user.email} (${user.role})`);

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
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/register
 * Initial registration endpoint. Role defaults to student unless super_admin registers.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'A user account with this email already exists.'
      });
    }

    // Never trust client role blindly: if unauthenticated, force student role
    const assignedRole = (req.user && req.user.role === ROLES.SUPER_ADMIN && role)
      ? role
      : ROLES.STUDENT;

    const newUser = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      department
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
        department: newUser.department
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
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register,
  getMe
};
