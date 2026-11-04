const mongoose = require('mongoose');
const Faculty = require('./faculty.model');
const FacultySubstitution = require('./substitution.model');
const Timetable = require('../timetable/timetable.model');
const { ROLES, HTTP_STATUS } = require('@college-erp/shared');
const { sendSuccess, sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Get faculty workload overview with timetable distribution and conflict detection
 * (Principal, HOD, Faculty)
 */
async function getFacultyWorkload(req, res, next) {
  try {
    const { facultyId, departmentId } = req.query;
    const user = req.user;

    const query = {};
    if (departmentId) query.department = departmentId;

    if (facultyId) {
      query._id = facultyId;
    } else if (user.role === ROLES.FACULTY) {
      const myProfile = await Faculty.findOne({ user: user._id });
      if (!myProfile) {
        return sendError(res, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          message: 'Faculty profile not found for authenticated user.'
        });
      }
      query._id = myProfile._id;
    }

    const facultyList = await Faculty.find(query)
      .populate('user', 'name email phone avatar')
      .populate('department', 'name code')
      .lean();

    const facultyIds = (Array.isArray(facultyList) ? facultyList : []).map((f) => f._id);

    const timetableSlots = await Timetable.find({
      faculty: { $in: facultyIds }
    })
      .populate('subject', 'name code credits')
      .populate('department', 'name code')
      .populate('course', 'name code')
      .lean();

    const slotsList = Array.isArray(timetableSlots) ? timetableSlots : [];

    const workloadData = (Array.isArray(facultyList) ? facultyList : []).map((fac) => {
      const slots = slotsList.filter(
        (s) => s.faculty && s.faculty.toString() === fac._id.toString()
      );

      const totalSlotsPerWeek = slots.length;
      const totalWeeklyHours = totalSlotsPerWeek;

      const subjectsMap = {};
      slots.forEach((s) => {
        if (s.subject) {
          subjectsMap[s.subject._id.toString()] = {
            id: s.subject._id,
            name: s.subject.name,
            code: s.subject.code,
            credits: s.subject.credits
          };
        }
      });
      const allocatedSubjects = Object.values(subjectsMap);

      const slotSignatures = new Set();
      const conflicts = [];
      slots.forEach((s) => {
        const sig = `${s.dayOfWeek}-${s.startTime}-${s.endTime}`;
        if (slotSignatures.has(sig)) {
          conflicts.push({
            day: s.dayOfWeek,
            time: `${s.startTime} - ${s.endTime}`,
            subject: s.subject?.name,
            message: `Double-booking detected on ${s.dayOfWeek} at ${s.startTime}`
          });
        }
        slotSignatures.add(sig);
      });

      return {
        facultyId: fac._id,
        name: fac.user?.name || fac.designation || 'Faculty Member',
        email: fac.user?.email,
        department: fac.department?.name || 'Department',
        designation: fac.designation,
        totalSlotsPerWeek,
        totalWeeklyHours,
        allocatedSubjects,
        hasConflicts: conflicts.length > 0,
        conflicts,
        slots: slots.map((s) => ({
          id: s._id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          roomNumber: s.roomNumber,
          subject: s.subject?.name,
          subjectCode: s.subject?.code,
          course: s.course?.name,
          semester: s.semester
        }))
      };
    });

    return sendSuccess(res, {
      message: 'Faculty workload overview retrieved',
      data: workloadData
    });
  } catch (error) {
    logger.error('Error fetching faculty workload:', error);
    next(error);
  }
}

/**
 * Assign substitute faculty with conflict validation
 * (Principal, HOD, Faculty)
 */
async function createSubstitution(req, res, next) {
  try {
    const { originalFacultyId, substituteFacultyId, timetableSlotId, date, reason } = req.body;

    if (!originalFacultyId || !substituteFacultyId || !timetableSlotId || !date || !reason) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Original faculty, substitute faculty, timetable slot, date, and reason are all required.'
      });
    }

    if (originalFacultyId === substituteFacultyId) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Original faculty and substitute faculty cannot be the same person.'
      });
    }

    const slot = await Timetable.findById(timetableSlotId).populate('subject', 'name code');
    if (!slot) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Timetable slot not found.'
      });
    }

    const subDate = new Date(date);
    if (isNaN(subDate.getTime())) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Invalid substitution date.'
      });
    }

    // Conflict detection for substitute faculty
    const substituteConflict = await Timetable.findOne({
      faculty: substituteFacultyId,
      dayOfWeek: slot.dayOfWeek,
      $or: [
        { startTime: slot.startTime },
        {
          $and: [
            { startTime: { $lt: slot.endTime } },
            { endTime: { $gt: slot.startTime } }
          ]
        }
      ]
    }).populate('subject', 'name');

    if (substituteConflict) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `Conflict Detected: The selected substitute faculty already has a lecture scheduled for "${substituteConflict.subject?.name || 'Subject'}" on ${slot.dayOfWeek} at ${substituteConflict.startTime} - ${substituteConflict.endTime}.`
      });
    }

    const existingSub = await FacultySubstitution.findOne({
      timetableSlot: timetableSlotId,
      date: subDate
    });

    if (existingSub) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'A substitution has already been scheduled for this timetable slot on the selected date.'
      });
    }

    const isAutoApproved = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD].includes(req.user.role);

    const substitution = await FacultySubstitution.create({
      originalFaculty: originalFacultyId,
      substituteFaculty: substituteFacultyId,
      timetableSlot: timetableSlotId,
      date: subDate,
      reason,
      status: isAutoApproved ? 'approved' : 'pending',
      requestedBy: req.user._id,
      reviewedBy: isAutoApproved ? req.user._id : undefined,
      reviewNotes: isAutoApproved ? 'Auto-approved by department authority' : undefined
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: isAutoApproved
        ? 'Faculty substitution assigned and approved successfully'
        : 'Faculty substitution request submitted for approval',
      data: substitution
    });
  } catch (error) {
    logger.error('Error creating faculty substitution:', error);
    next(error);
  }
}

/**
 * List substitutions
 */
async function listSubstitutions(req, res, next) {
  try {
    const { status, date, facultyId } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (facultyId) {
      query.$or = [{ originalFaculty: facultyId }, { substituteFaculty: facultyId }];
    }

    const substitutions = await FacultySubstitution.find(query)
      .populate({
        path: 'originalFaculty',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'substituteFaculty',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'timetableSlot',
        populate: [
          { path: 'subject', select: 'name code' },
          { path: 'department', select: 'name' }
        ]
      })
      .populate('requestedBy', 'name email role')
      .populate('reviewedBy', 'name email role')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return sendSuccess(res, {
      message: 'Substitutions retrieved',
      data: substitutions
    });
  } catch (error) {
    logger.error('Error listing substitutions:', error);
    next(error);
  }
}

/**
 * Review substitution (Approve / Reject) (HOD, Principal, Super Admin)
 */
async function reviewSubstitution(req, res, next) {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Status must be either "approved" or "rejected".'
      });
    }

    const substitution = await FacultySubstitution.findById(id);
    if (!substitution) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Substitution not found.'
      });
    }

    substitution.status = status;
    substitution.reviewedBy = req.user._id;
    if (reviewNotes) substitution.reviewNotes = reviewNotes;

    await substitution.save();

    return sendSuccess(res, {
      message: `Substitution ${status} successfully`,
      data: substitution
    });
  } catch (error) {
    logger.error('Error reviewing substitution:', error);
    next(error);
  }
}

module.exports = {
  getFacultyWorkload,
  createSubstitution,
  listSubstitutions,
  reviewSubstitution
};
