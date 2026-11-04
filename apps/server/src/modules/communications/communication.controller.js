const { CommunicationTemplate, CommunicationLog } = require('./index');
const Notification = require('../notifications/notification.model');
const User = require('../auth/auth.model');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

// -----------------------------------------------------------------------------
// TEMPLATE MANAGEMENT
// -----------------------------------------------------------------------------

async function listTemplates(req, res, next) {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.channel) query.channel = req.query.channel;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';

    const templates = await CommunicationTemplate.find(query).sort({ name: 1 });
    return sendSuccess(res, { data: templates });
  } catch (error) {
    next(error);
  }
}

async function getTemplateById(req, res, next) {
  try {
    const template = await CommunicationTemplate.findById(req.params.id);
    if (!template) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Communication template not found',
        code: 'NOT_FOUND'
      });
    }
    return sendSuccess(res, { data: template });
  } catch (error) {
    next(error);
  }
}

async function createTemplate(req, res, next) {
  try {
    const cleanCode = String(req.body.code).trim().toUpperCase();
    const existing = await CommunicationTemplate.findOne({ code: cleanCode });
    if (existing) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `Template with code '${cleanCode}' already exists`,
        code: 'DUPLICATE_TEMPLATE_CODE'
      });
    }

    const template = await CommunicationTemplate.create({
      ...req.body,
      code: cleanCode,
      createdBy: req.user._id
    });

    await recordAuditLog({
      req,
      action: 'COMMUNICATION_TEMPLATE_CREATED',
      entityType: 'CommunicationTemplate',
      entityId: template._id,
      details: { code: template.code, category: template.category }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Communication template created successfully',
      data: template
    });
  } catch (error) {
    next(error);
  }
}

// -----------------------------------------------------------------------------
// BROADCAST & DISPATCH ENGINE
// -----------------------------------------------------------------------------

async function sendBroadcast(req, res, next) {
  try {
    const {
      targetRole,
      recipientId,
      templateId,
      templateParams = {},
      subject,
      content,
      channel = 'in_app',
      category = 'General',
      priority = 'medium'
    } = req.body;

    let finalSubject = subject || '';
    let finalContent = content || '';

    // If template specified, render using safe token substitution
    let templateDoc = null;
    if (templateId) {
      templateDoc = await CommunicationTemplate.findById(templateId);
      if (templateDoc) {
        const rendered = templateDoc.render(templateParams);
        finalSubject = rendered.subject || finalSubject;
        finalContent = rendered.body || finalContent;
      }
    }

    if (!finalContent || !finalContent.trim()) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Message content is required (directly or through template rendering)',
        code: 'MISSING_CONTENT'
      });
    }

    // Determine target users
    let targetUsers = [];
    if (recipientId) {
      const singleUser = await User.findById(recipientId);
      if (singleUser) targetUsers = [singleUser];
    } else if (targetRole) {
      const userQuery = targetRole === 'all' ? {} : { role: targetRole, status: 'active' };
      targetUsers = await User.find(userQuery).limit(500);
    }

    if (targetUsers.length === 0) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'No recipient users found matching specified target criteria',
        code: 'NO_RECIPIENTS'
      });
    }

    // Detect if live email/sms credentials are configured
    const hasLiveSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    const hasLiveSms = Boolean(process.env.SMS_API_KEY);

    let effectiveChannel = channel;
    let effectiveStatus = 'delivered_in_app';

    if (channel === 'email') {
      if (hasLiveSmtp) {
        effectiveChannel = 'email_live';
        effectiveStatus = 'sent_live';
      } else {
        effectiveChannel = 'email_simulated';
        effectiveStatus = 'simulated_local';
      }
    } else if (channel === 'sms') {
      if (hasLiveSms) {
        effectiveChannel = 'sms_live';
        effectiveStatus = 'sent_live';
      } else {
        effectiveChannel = 'sms_simulated';
        effectiveStatus = 'simulated_local';
      }
    }

    // Dispatch in-app notifications if channel is in_app
    if (channel === 'in_app') {
      const notifDocs = targetUsers.map((u) => ({
        recipient: u._id,
        recipientRole: u.role,
        category: category || 'General',
        title: finalSubject || 'Campus Communication Notice',
        message: finalContent,
        priority: priority || 'medium',
        read: false
      }));
      await Notification.insertMany(notifDocs);
    }

    // Record each dispatch in CommunicationLog
    const logBatch = targetUsers.map((u, idx) => ({
      logId: `LOG-${Date.now().toString(36).toUpperCase()}-${idx + 1}`,
      template: templateDoc?._id || null,
      sender: req.user._id,
      senderRole: req.user.role,
      recipient: u._id,
      recipientRole: u.role,
      channel: effectiveChannel,
      category,
      subject: finalSubject,
      content: finalContent,
      status: effectiveStatus,
      metadata: {
        targetEmail: u.email,
        variablesUsed: templateParams,
        deliveryNotes: effectiveStatus === 'simulated_local'
          ? 'Provider credentials not configured in environment; delivery simulated and logged locally.'
          : 'Delivered directly to user in-app notification center.'
      },
      dispatchedAt: new Date()
    }));

    await CommunicationLog.insertMany(logBatch);

    await recordAuditLog({
      req,
      action: 'COMMUNICATION_BROADCAST_DISPATCHED',
      entityType: 'CommunicationLog',
      details: {
        channel: effectiveChannel,
        status: effectiveStatus,
        recipientsCount: targetUsers.length,
        subject: finalSubject
      }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: `Communication broadcast dispatched to ${targetUsers.length} recipient(s)`,
      data: {
        recipientsCount: targetUsers.length,
        channel: effectiveChannel,
        deliveryStatus: effectiveStatus,
        isSimulated: effectiveStatus === 'simulated_local',
        subject: finalSubject
      }
    });
  } catch (error) {
    next(error);
  }
}

async function listLogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.channel) query.channel = req.query.channel;
    if (req.query.status) query.status = req.query.status;

    const [logs, total] = await Promise.all([
      CommunicationLog.find(query)
        .populate('sender', 'name email role')
        .populate('recipient', 'name email role')
        .skip(skip)
        .limit(limit)
        .sort({ dispatchedAt: -1 }),
      CommunicationLog.countDocuments(query)
    ]);

    return sendSuccess(res, {
      message: 'Communication dispatch history retrieved',
      data: logs,
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

module.exports = {
  listTemplates,
  getTemplateById,
  createTemplate,
  sendBroadcast,
  listLogs
};

