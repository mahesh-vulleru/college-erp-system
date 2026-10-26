const User = require('../auth/auth.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, USER_STATUS } = require('@college-erp/shared');

/**
 * GET /api/v1/users
 * Retrieve list of institutional users with pagination, search, and filtering
 */
async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    // Search filter across name and email
    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim()) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    if (req.query.role) query.role = req.query.role;
    if (req.query.department) query.department = req.query.department;
    if (req.query.status) query.status = req.query.status;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    return sendSuccess(res, {
      message: 'Institutional users retrieved successfully',
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/:id
 */
async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'User not found with provided ID',
        code: 'USER_NOT_FOUND'
      });
    }
    return sendSuccess(res, { data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/users
 * Super Admin creates other institutional accounts
 */
async function createUser(req, res, next) {
  try {
    const { name, email, password, role, department, status, isTemporaryPassword } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : '';

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'A user account with this email address already exists',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    const newUser = await User.create({
      name: name ? name.trim() : '',
      email: cleanEmail,
      password,
      role,
      department: department ? department.trim() : undefined,
      status: status || USER_STATUS.ACTIVE,
      isTemporaryPassword: isTemporaryPassword !== undefined ? !!isTemporaryPassword : true
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Institutional user created successfully',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        status: newUser.status,
        isTemporaryPassword: newUser.isTemporaryPassword,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/users/:id
 * Super Admin updates an existing user profile (name, role, department, status)
 */
async function updateUser(req, res, next) {
  try {
    const { name, role, department, status } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'User not found with provided ID',
        code: 'USER_NOT_FOUND'
      });
    }

    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (department !== undefined) user.department = department ? department.trim() : '';
    if (status) user.status = status;

    await user.save();

    return sendSuccess(res, {
      message: 'User account updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        isTemporaryPassword: user.isTemporaryPassword,
        lastLogin: user.lastLogin,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/users/:id/status
 * Super Admin toggles user active / disabled status
 */
async function updateUserStatus(req, res, next) {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    return sendSuccess(res, {
      message: `User status updated to ${status} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/users/:id/reset-password
 * Super Admin resets a user's password with a temporary password
 */
async function resetUserPassword(req, res, next) {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    user.password = newPassword;
    user.isTemporaryPassword = true;
    await user.save(); // Triggers bcrypt hashing pre-save hook

    return sendSuccess(res, {
      message: `Password has been reset successfully for ${user.email}. Temporary password flag set.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword
};
