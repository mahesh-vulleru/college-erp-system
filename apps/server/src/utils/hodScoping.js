const mongoose = require('mongoose');
const Department = require('../modules/departments/department.model');

/**
 * Resolves the Department associated with an HOD user.
 * @param {Object} user - The authenticated user object (req.user)
 * @returns {Promise<Object|null>}
 */
async function resolveHodDepartment(user) {
  if (!user) return null;
  return Department.findOne({
    $or: [
      { hod: user._id },
      ...(user.department
        ? [
            ...(mongoose.Types.ObjectId.isValid(user.department) ? [{ _id: user.department }] : []),
            { name: user.department },
            { code: String(user.department).toUpperCase() }
          ]
        : [])
    ]
  });
}

/**
 * Checks if a given department ID matches the HOD's assigned department.
 * @param {Object} user - The authenticated user object (req.user)
 * @param {string|mongoose.Types.ObjectId} targetDeptId
 * @returns {Promise<boolean>}
 */
async function isHodDepartment(user, targetDeptId) {
  if (!user || !targetDeptId) return false;
  const dept = await resolveHodDepartment(user);
  if (!dept) return false;
  const targetStr = targetDeptId._id ? targetDeptId._id.toString() : targetDeptId.toString();
  return dept._id.toString() === targetStr;
}

module.exports = {
  resolveHodDepartment,
  isHodDepartment
};

