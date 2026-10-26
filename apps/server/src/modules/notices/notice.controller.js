const Notice = require('./notice.model');
const { sendSuccess } = require('../../utils/response');
const { HTTP_STATUS } = require('@college-erp/shared');

async function listNotices(req, res, next) {
  try {
    const role = req.user?.role;
    const query = {
      $or: [
        { targetRoles: '*' },
        { targetRoles: role }
      ]
    };

    const notices = await Notice.find(query)
      .populate('publishedBy', 'name role')
      .populate('department', 'name code')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(30);

    return sendSuccess(res, {
      message: 'Institutional circulars and notices retrieved',
      data: notices,
      meta: { count: notices.length }
    });
  } catch (error) {
    next(error);
  }
}

async function createNotice(req, res, next) {
  try {
    const notice = await Notice.create({
      ...req.body,
      publishedBy: req.user._id
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Notice circular published successfully',
      data: notice
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotices,
  createNotice
};

