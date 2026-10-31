const InstitutionalEvent = require('./institutionalEvent.model');
const Department = require('../departments/department.model');
const User = require('../auth/auth.model');
const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');

/**
 * List Institutional Events & Deadlines with Filters & Computed Schedule Metrics
 */
async function listEvents(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.category && req.query.category !== 'all') {
      query.eventCategory = req.query.category;
    }

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status.toLowerCase();
    }

    if (req.query.priority && req.query.priority !== 'all') {
      query.priority = req.query.priority.toLowerCase();
    }

    if (req.query.department && req.query.department !== 'all') {
      if (req.query.department === 'campus_wide') {
        query.department = null;
      } else if (mongoose.Types.ObjectId.isValid(req.query.department)) {
        query.department = req.query.department;
      }
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.startDate = { $lte: new Date(req.query.endDate) };
      query.endDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.startDate) {
      query.endDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.startDate = { $lte: new Date(req.query.endDate) };
    }

    const search = req.query.search || req.query.q;
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }, { venue: regex }];
    }

    let allEvents = [];
    try {
      allEvents = await InstitutionalEvent.find(query)
        .populate('department', 'name code')
        .populate('assignedOwner', 'name email role')
        .populate('relatedGoal', 'title targetValue unit')
        .populate('relatedCriteria', 'code title')
        .populate('createdBy', 'name email')
        .sort({ startDate: 1, priority: 1 })
        .lean();
    } catch (e) {
      allEvents = [];
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let todayEventsCount = 0;
    let upcomingDeadlinesCount = 0;
    let overdueTasksCount = 0;
    let completedTasksCount = 0;
    let eventsThisMonthCount = 0;

    const categoryMap = {};

    const updatedEvents = allEvents.map((evt) => {
      const start = new Date(evt.startDate);
      const end = new Date(evt.endDate);
      let effectiveStatus = evt.status;

      if (effectiveStatus !== 'completed' && effectiveStatus !== 'cancelled') {
        if (end < now) {
          effectiveStatus = 'overdue';
        } else if (start <= now && end >= now) {
          effectiveStatus = 'in_progress';
        }
      }

      if (effectiveStatus === 'completed') completedTasksCount += 1;
      if (effectiveStatus === 'overdue') overdueTasksCount += 1;

      // Today's events
      if (start <= todayEnd && end >= todayStart) {
        todayEventsCount += 1;
      }

      // Upcoming deadlines (within next 14 days and not completed)
      if (effectiveStatus !== 'completed' && end >= now && end <= fourteenDaysLater) {
        upcomingDeadlinesCount += 1;
      }

      // Events this month
      if (start <= monthEnd && end >= monthStart) {
        eventsThisMonthCount += 1;
      }

      // Category breakdown
      const cat = evt.eventCategory || 'Academic Event';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;

      return {
        ...evt,
        id: evt._id,
        status: effectiveStatus,
        isOverdue: effectiveStatus === 'overdue'
      };
    });

    const summary = {
      todayEvents: todayEventsCount,
      upcomingDeadlines: upcomingDeadlinesCount,
      overdueTasks: overdueTasksCount,
      completedTasks: completedTasksCount,
      eventsThisMonth: eventsThisMonthCount,
      totalEvents: updatedEvents.length,
      categoryBreakdown: categoryMap
    };

    const paginatedItems = updatedEvents.slice(skip, skip + limit);

    return sendSuccess(res, {
      message: 'Institutional events and deadlines retrieved successfully',
      data: {
        summary,
        events: paginatedItems,
        pagination: {
          page,
          limit,
          total: updatedEvents.length,
          totalPages: Math.ceil(updatedEvents.length / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Summary Metrics for Dashboard Event & Deadline Cards
 */
async function getEventsSummary(req, res, next) {
  try {
    const allEvents = await InstitutionalEvent.find().lean();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let todayEventsCount = 0;
    let upcomingDeadlinesCount = 0;
    let overdueTasksCount = 0;
    let completedTasksCount = 0;
    let eventsThisMonthCount = 0;

    allEvents.forEach((evt) => {
      const start = new Date(evt.startDate);
      const end = new Date(evt.endDate);
      let effectiveStatus = evt.status;

      if (effectiveStatus !== 'completed' && effectiveStatus !== 'cancelled') {
        if (end < now) {
          effectiveStatus = 'overdue';
        } else if (start <= now && end >= now) {
          effectiveStatus = 'in_progress';
        }
      }

      if (effectiveStatus === 'completed') completedTasksCount += 1;
      if (effectiveStatus === 'overdue') overdueTasksCount += 1;
      if (start <= todayEnd && end >= todayStart) todayEventsCount += 1;
      if (effectiveStatus !== 'completed' && end >= now && end <= fourteenDaysLater) upcomingDeadlinesCount += 1;
      if (start <= monthEnd && end >= monthStart) eventsThisMonthCount += 1;
    });

    return sendSuccess(res, {
      message: 'Institutional events summary retrieved',
      data: {
        todayEvents: todayEventsCount,
        upcomingDeadlines: upcomingDeadlinesCount,
        overdueTasks: overdueTasksCount,
        completedTasks: completedTasksCount,
        eventsThisMonth: eventsThisMonthCount,
        totalEvents: allEvents.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Event Details by ID
 */
async function getEventById(req, res, next) {
  try {
    const event = await InstitutionalEvent.findById(req.params.id)
      .populate('department', 'name code')
      .populate('assignedOwner', 'name email role')
      .populate('relatedGoal', 'title targetValue unit')
      .populate('relatedCriteria', 'code title')
      .populate('createdBy', 'name email');

    if (!event) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Institutional event not found',
        code: 'NOT_FOUND'
      });
    }

    return sendSuccess(res, { data: event });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Event / Deadline
 */
async function createEvent(req, res, next) {
  try {
    const {
      title,
      description,
      eventCategory,
      startDate,
      endDate,
      priority,
      department,
      assignedOwner,
      venue,
      isAllDay,
      relatedGoal,
      relatedCriteria,
      reminderDaysBefore
    } = req.body;

    const event = await InstitutionalEvent.create({
      title,
      description,
      eventCategory: eventCategory || 'Academic Event',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      priority: priority || 'medium',
      department: department || null,
      assignedOwner,
      venue: venue || 'Main Campus',
      isAllDay: Boolean(isAllDay),
      relatedGoal: relatedGoal || null,
      relatedCriteria: relatedCriteria || null,
      reminderDaysBefore: reminderDaysBefore !== undefined ? Number(reminderDaysBefore) : 2,
      status: 'scheduled',
      createdBy: req.user._id
    });

    await recordAuditLog({
      req,
      action: 'INSTITUTIONAL_EVENT_CREATED',
      entityType: 'InstitutionalEvent',
      entityId: event._id,
      details: { title: event.title, category: event.eventCategory, startDate: event.startDate }
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Institutional event registered successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Event / Deadline
 */
async function updateEvent(req, res, next) {
  try {
    const event = await InstitutionalEvent.findById(req.params.id);
    if (!event) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Institutional event not found',
        code: 'NOT_FOUND'
      });
    }

    const {
      title,
      description,
      eventCategory,
      startDate,
      endDate,
      priority,
      department,
      assignedOwner,
      venue,
      status,
      isAllDay,
      relatedGoal,
      relatedCriteria,
      reminderDaysBefore
    } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (eventCategory) event.eventCategory = eventCategory;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);
    if (priority) event.priority = priority;
    if (department !== undefined) event.department = department || null;
    if (assignedOwner) event.assignedOwner = assignedOwner;
    if (venue !== undefined) event.venue = venue;
    if (status) event.status = status;
    if (isAllDay !== undefined) event.isAllDay = Boolean(isAllDay);
    if (relatedGoal !== undefined) event.relatedGoal = relatedGoal || null;
    if (relatedCriteria !== undefined) event.relatedCriteria = relatedCriteria || null;
    if (reminderDaysBefore !== undefined) event.reminderDaysBefore = Number(reminderDaysBefore);

    await event.save();

    await recordAuditLog({
      req,
      action: 'INSTITUTIONAL_EVENT_UPDATED',
      entityType: 'InstitutionalEvent',
      entityId: event._id,
      details: { title: event.title, status: event.status }
    });

    return sendSuccess(res, {
      message: 'Institutional event updated successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Event
 */
async function deleteEvent(req, res, next) {
  try {
    const event = await InstitutionalEvent.findById(req.params.id);
    if (!event) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Institutional event not found',
        code: 'NOT_FOUND'
      });
    }

    await InstitutionalEvent.findByIdAndDelete(req.params.id);

    await recordAuditLog({
      req,
      action: 'INSTITUTIONAL_EVENT_DELETED',
      entityType: 'InstitutionalEvent',
      entityId: event._id,
      details: { title: event.title }
    });

    return sendSuccess(res, {
      message: 'Institutional event removed successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark Event / Task as Completed
 */
async function markEventCompleted(req, res, next) {
  try {
    const { completionNotes } = req.body;

    const event = await InstitutionalEvent.findById(req.params.id);
    if (!event) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Institutional event not found',
        code: 'NOT_FOUND'
      });
    }

    event.status = 'completed';
    event.completedAt = new Date();
    event.completionNotes = completionNotes || 'Marked as completed by institutional administrator';

    await event.save();

    await recordAuditLog({
      req,
      action: 'INSTITUTIONAL_EVENT_COMPLETED',
      entityType: 'InstitutionalEvent',
      entityId: event._id,
      details: { title: event.title, completedAt: event.completedAt }
    });

    return sendSuccess(res, {
      message: 'Event marked as completed',
      data: event
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listEvents,
  getEventsSummary,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  markEventCompleted
};

