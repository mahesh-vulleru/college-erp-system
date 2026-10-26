const User = require('../auth/auth.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

/**
 * GET /api/v1/users
 * Retrieve list of institutional users with pagination and filtering
 */
async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.department) query.department = req.query.department;
    if (req.query.status) query.status = req.query.status;

    const [users, total] = await Promise.all([
      User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
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
 * PATCH /api/v1/users/:id/status
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
      message: 'User status updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  getUserById,
  updateUserStatus
};

