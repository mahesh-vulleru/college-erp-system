const Notice = require('./notice.model');
const Student = require('../students/student.model');
const Faculty = require('../faculty/faculty.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

/**
 * GET /api/v1/notices
 * Enforce backend audience visibility and date validity
 */
async function listNotices(req, res, next) {
  try {
    const role = req.user?.role;
    const now = new Date();

    const query = {};

    // Keyword search
    if (req.query.q && typeof req.query.q === 'string' && req.query.q.trim()) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      query.$or = [{ title: regex }, { content: regex }];
    }

    if (req.query.category) query.category = req.query.category;
    if (req.query.priority) query.priority = req.query.priority;

    // Audience & Status scoping
    if (role === ROLES.SUPER_ADMIN || role === ROLES.PRINCIPAL) {
      // Management can filter by status or view all
      if (req.query.status) {
        query.status = req.query.status;
      }
      if (req.query.department) {
        query.department = req.query.department;
      }
    } else if (role === ROLES.HOD) {
      // HODs see notices for them or their department, plus anything they authored
      const hodDepartment = req.user.department;
      const audienceFilter = {
        $or: [
          { publishedBy: req.user._id },
          {
            status: 'published',
            publicationDate: { $lte: now },
            $and: [
              { $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] },
              { $or: [{ targetRoles: '*' }, { targetRoles: role }] },
              { $or: [{ department: null }, ...(hodDepartment ? [{ department: hodDepartment }] : [])] }
            ]
          }
        ]
      };

      if (query.$or) {
        query.$and = [{ $or: query.$or }, audienceFilter];
        delete query.$or;
      } else {
        Object.assign(query, audienceFilter);
      }
    } else {
      // Faculty, Student, Accounts: strictly published & unexpired
      query.status = 'published';
      query.publicationDate = { $lte: now };

      let userDept = null;
      if (role === ROLES.STUDENT) {
        const studentProfile = await Student.findOne({ user: req.user._id });
        userDept = studentProfile?.department || null;
      } else if (role === ROLES.FACULTY) {
        const facultyProfile = await Faculty.findOne({ user: req.user._id });
        userDept = facultyProfile?.department || null;
      }

      const roleFilter = [
        { $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] },
        { $or: [{ targetRoles: '*' }, { targetRoles: role }] },
        { $or: [{ department: null }, ...(userDept ? [{ department: userDept }] : [])] }
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, ...roleFilter];
        delete query.$or;
      } else {
        query.$and = roleFilter;
      }
    }

    const notices = await Notice.find(query)
      .populate('publishedBy', 'name role email')
      .populate('department', 'name code')
      .sort({ isPinned: -1, publicationDate: -1, createdAt: -1 })
      .limit(req.query.limit ? parseInt(req.query.limit, 10) : 50);

    return sendSuccess(res, {
      message: 'Institutional circulars and notices retrieved',
      data: notices,
      meta: { count: notices.length }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/notices/:id
 */
async function getNoticeById(req, res, next) {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('publishedBy', 'name role email')
      .populate('department', 'name code')
      .populate('history.performedBy', 'name role');

    if (!notice) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Notice circular not found',
        code: 'NOT_FOUND'
      });
    }

    // Role check for unpublished notices
    const role = req.user.role;
    if (
      notice.status !== 'published' &&
      role !== ROLES.SUPER_ADMIN &&
      role !== ROLES.PRINCIPAL &&
      notice.publishedBy._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: 'Access to unpublished draft notice is restricted',
        code: 'FORBIDDEN'
      });
    }

    return sendSuccess(res, {
      message: 'Notice circular details retrieved',
      data: notice
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/notices
 */
async function createNotice(req, res, next) {
  try {
    const {
      title,
      content,
      category = 'General',
      targetRoles = ['*'],
      department = null,
      priority = 'normal',
      isPinned = false,
      status = 'published',
      publicationDate = new Date(),
      expiryDate = null
    } = req.body;

    // Validate date logic
    if (expiryDate && new Date(expiryDate) <= new Date(publicationDate)) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Notice expiry date must be strictly after the publication date.',
        code: 'INVALID_EXPIRY_DATE'
      });
    }

    const historyEntry = {
      action: 'created',
      performedBy: req.user._id,
      timestamp: new Date(),
      note: status === 'published' ? 'Notice created and published directly' : 'Notice created as draft'
    };

    const notice = await Notice.create({
      title,
      content,
      category,
      targetRoles,
      department: department || null,
      priority,
      isPinned,
      status,
      publicationDate: new Date(publicationDate),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      publishedBy: req.user._id,
      history: [historyEntry]
    });

    await recordAuditLog({
      req,
      action: status === 'published' ? 'NOTICE_PUBLISHED' : 'NOTICE_DRAFT_CREATED',
      entityType: 'Notice',
      entityId: notice._id,
      details: {
        title: notice.title,
        status: notice.status,
        targetRoles: notice.targetRoles,
        priority: notice.priority
      }
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

/**
 * PUT /api/v1/notices/:id
 */
async function updateNotice(req, res, next) {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Notice circular not found',
        code: 'NOT_FOUND'
      });
    }

    // Authorization: Super Admin, Principal, or author HOD
    const role = req.user.role;
    if (
      role !== ROLES.SUPER_ADMIN &&
      role !== ROLES.PRINCIPAL &&
      notice.publishedBy.toString() !== req.user._id.toString()
    ) {
      return sendError(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: 'You are not authorized to edit this notice circular',
        code: 'FORBIDDEN'
      });
    }

    const updatable = [
      'title',
      'content',
      'category',
      'targetRoles',
      'department',
      'priority',
      'isPinned',
      'status',
      'publicationDate',
      'expiryDate'
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        notice[field] = req.body[field];
      }
    });

    // Validate dates
    if (notice.expiryDate && new Date(notice.expiryDate) <= new Date(notice.publicationDate)) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Notice expiry date must be after publication date.',
        code: 'INVALID_EXPIRY_DATE'
      });
    }

    notice.history.push({
      action: 'updated',
      performedBy: req.user._id,
      timestamp: new Date(),
      note: req.body.editNote || 'Notice content or parameters updated'
    });

    await notice.save();

    await recordAuditLog({
      req,
      action: 'NOTICE_UPDATED',
      entityType: 'Notice',
      entityId: notice._id,
      details: { title: notice.title, status: notice.status }
    });

    return sendSuccess(res, {
      message: 'Notice updated successfully',
      data: notice
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notices/:id/publish
 */
async function publishNotice(req, res, next) {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Notice not found',
        code: 'NOT_FOUND'
      });
    }

    notice.status = 'published';
    notice.publicationDate = new Date();
    notice.history.push({
      action: 'published',
      performedBy: req.user._id,
      timestamp: new Date(),
      note: 'Draft promoted to published campus circular'
    });

    await notice.save();

    await recordAuditLog({
      req,
      action: 'NOTICE_PUBLISHED',
      entityType: 'Notice',
      entityId: notice._id,
      details: { title: notice.title }
    });

    return sendSuccess(res, {
      message: 'Notice published successfully',
      data: notice
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notices/:id/archive
 */
async function archiveNotice(req, res, next) {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Notice not found',
        code: 'NOT_FOUND'
      });
    }

    notice.status = 'archived';
    notice.history.push({
      action: 'archived',
      performedBy: req.user._id,
      timestamp: new Date(),
      note: 'Notice moved to institutional archive'
    });

    await notice.save();

    await recordAuditLog({
      req,
      action: 'NOTICE_ARCHIVED',
      entityType: 'Notice',
      entityId: notice._id,
      details: { title: notice.title }
    });

    return sendSuccess(res, {
      message: 'Notice circular archived successfully',
      data: notice
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  publishNotice,
  archiveNotice
};
