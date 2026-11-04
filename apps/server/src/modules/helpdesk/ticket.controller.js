const mongoose = require('mongoose');
const HelpdeskTicket = require('./ticket.model');
const { ROLES, HTTP_STATUS } = require('@college-erp/shared');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Submit a complaint / grievance ticket (All 13 roles)
 */
async function createTicket(req, res, next) {
  try {
    const title = req.body.title || req.body.subject;
    const description = req.body.description || req.body.message;
    const { category, priority, assignedDepartment } = req.body;

    if (!title || !description) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Title and detailed description are required.'
      });
    }

    const categoryMap = {
      academic: 'Academic',
      examination: 'Examination',
      accounts: 'Fee & Accounts',
      fees: 'Fee & Accounts',
      library: 'Library',
      transport: 'Transport & Fleet',
      hostel: 'Hostel & Mess',
      it_support: 'IT & Technical Support',
      general: 'General'
    };
    const normalizedCategory = categoryMap[String(category || '').toLowerCase()] || category || 'General';

    const ticket = await HelpdeskTicket.create({
      title,
      description,
      category: normalizedCategory,
      priority: priority || 'medium',
      assignedDepartment: assignedDepartment || 'General Administration',
      submittedBy: req.user._id,
      submittedByRole: req.user.role,
      status: 'open'
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Helpdesk ticket submitted successfully',
      data: ticket
    });
  } catch (error) {
    logger.error('Error creating helpdesk ticket:', error);
    next(error);
  }
}

/**
 * List tickets with role-based visibility and filters
 */
async function listTickets(req, res, next) {
  try {
    const { status, category, priority, page = 1, limit = 20, search } = req.query;
    const user = req.user;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // Role-based visibility
    const elevatedRoles = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, 'admin', 'superadmin'];
    const departmentManagerRoles = [ROLES.HOD, ROLES.ACCOUNTS, ROLES.LIBRARIAN, ROLES.TRANSPORT_ADMIN];

    if (!elevatedRoles.includes(user.role)) {
      if (departmentManagerRoles.includes(user.role)) {
        let deptName = '';
        if (user.role === ROLES.ACCOUNTS) deptName = 'Fee & Accounts';
        else if (user.role === ROLES.LIBRARIAN) deptName = 'Library';
        else if (user.role === ROLES.TRANSPORT_ADMIN) deptName = 'Transport & Fleet';
        else if (user.role === ROLES.HOD) deptName = 'Academic';

        query.$or = [
          { submittedBy: user._id },
          { category: deptName },
          { assignedTo: user._id }
        ];
      } else {
        query.submittedBy = user._id;
      }
    }

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (priority && priority !== 'all') query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const [total, tickets] = await Promise.all([
      HelpdeskTicket.countDocuments(query),
      HelpdeskTicket.find(query)
        .populate('submittedBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return sendSuccess(res, {
      message: 'Helpdesk tickets retrieved',
      data: {
        tickets,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Error listing helpdesk tickets:', error);
    next(error);
  }
}

/**
 * Get ticket details by ID with comments
 */
async function getTicketById(req, res, next) {
  try {
    const { id } = req.params;
    const ticket = await HelpdeskTicket.findById(id)
      .populate('submittedBy', 'name email role phone')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('comments.user', 'name email role');

    if (!ticket) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Ticket not found.'
      });
    }

    const elevatedRoles = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, 'admin'];
    const isOwner = ticket.submittedBy?._id?.toString() === req.user._id.toString();
    const isAssigned = ticket.assignedTo?._id?.toString() === req.user._id.toString();

    if (!elevatedRoles.includes(req.user.role) && !isOwner && !isAssigned) {
      const isDeptManager = [ROLES.HOD, ROLES.ACCOUNTS, ROLES.LIBRARIAN, ROLES.TRANSPORT_ADMIN].includes(req.user.role);
      if (!isDeptManager) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Access Forbidden: You do not have permission to view this ticket.'
        });
      }
    }

    return sendSuccess(res, {
      message: 'Ticket details retrieved',
      data: ticket
    });
  } catch (error) {
    logger.error('Error getting ticket by id:', error);
    next(error);
  }
}

/**
 * Add a comment or update to a ticket
 */
async function addTicketComment(req, res, next) {
  try {
    const { id } = req.params;
    const comment = req.body.comment || req.body.message;
    const { isInternal } = req.body;

    if (!comment || !comment.trim()) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Comment text is required.'
      });
    }

    const ticket = await HelpdeskTicket.findById(id);
    if (!ticket) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Ticket not found.'
      });
    }

    ticket.comments.push({
      user: req.user._id,
      authorName: req.user.name || 'User',
      authorRole: req.user.role,
      comment: comment.trim(),
      isInternal: Boolean(isInternal)
    });

    if (ticket.status === 'resolved' && ticket.submittedBy.toString() === req.user._id.toString()) {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    return sendSuccess(res, {
      message: 'Comment added to ticket successfully',
      data: ticket
    });
  } catch (error) {
    logger.error('Error adding ticket comment:', error);
    next(error);
  }
}

/**
 * Update ticket status, assignment, or resolution notes
 */
async function updateTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { status, assignedDepartment, assignedTo, priority, resolutionNotes } = req.body;

    const ticket = await HelpdeskTicket.findById(id);
    if (!ticket) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Ticket not found.'
      });
    }

    if (status) ticket.status = status;
    if (assignedDepartment) ticket.assignedDepartment = assignedDepartment;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
    if (priority) ticket.priority = priority;
    if (resolutionNotes !== undefined) ticket.resolutionNotes = resolutionNotes;

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = req.user._id;
    }

    await ticket.save();

    return sendSuccess(res, {
      message: 'Ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    logger.error('Error updating ticket:', error);
    next(error);
  }
}

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  addTicketComment,
  updateTicket
};
