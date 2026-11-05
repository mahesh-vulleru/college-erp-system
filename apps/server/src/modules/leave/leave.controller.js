const Leave = require('./leave.model');
const Faculty = require('../faculty/faculty.model');
const Student = require('../students/student.model');
const Department = require('../departments/department.model');
const User = require('../auth/auth.model');
const Notice = require('../notices/notice.model');
const mongoose = require('mongoose');
const { sendSuccess, sendError } = require('../../utils/response');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');
const { recordAuditLog } = require('../../utils/auditLogger');
const { resolveHodDepartment } = require('../../utils/hodScoping');
const {
  getActiveWorkflows,
  updateActiveWorkflows,
  resolveMaxStages,
  getApproverRoleForStage,
  resolveApproverUser
} = require('./leaveWorkflow');

/**
 * Dispatches targeted institutional notifications to relevant parties without throwing on offline DB
 */
async function createLeaveNotification({ title, content, targetRoles, department, author, priority = 'normal' }) {
  try {
    if (mongoose.connection.readyState !== 1) return;
    await Notice.create({
      title,
      content,
      category: 'General',
      targetRoles: targetRoles || ['*'],
      department: department || null,
      priority,
      status: 'published',
      author: author || undefined,
      publishedAt: new Date()
    });
  } catch (err) {
    // Non-blocking notification dispatch
  }
}

/**
 * List Leave Requests with role-based scoping, filters, and summary metrics
 */
async function listLeaveRequests(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    const scope = (req.query.scope || '').toLowerCase().trim();

    // 1. Role-based scoping
    if (req.user.role === ROLES.STUDENT) {
      // Students can only access their own leaves
      query.user = req.user._id;
    } else if (req.user.role === ROLES.FACULTY) {
      if (scope === 'approvals') {
        // Teacher viewing pending leaves from assigned students
        const faculty = await Faculty.findOne({ user: req.user._id });
        query.applicantRole = ROLES.STUDENT;
        query.currentApproverRole = ROLES.FACULTY;
        if (faculty && faculty.department) {
          query.$or = [
            { currentApprover: req.user._id },
            { department: faculty.department }
          ];
        } else {
          query.currentApprover = req.user._id;
        }
      } else {
        // Default / My leaves: Faculty's own leaves
        const faculty = await Faculty.findOne({ user: req.user._id });
        if (!faculty) {
          return sendError(res, {
            statusCode: HTTP_STATUS.NOT_FOUND,
            message: 'Faculty profile not found for current user',
            code: 'PROFILE_NOT_FOUND'
          });
        }
        query.user = req.user._id;
      }
    } else if (req.user.role === ROLES.HOD) {
      if (scope === 'my-leaves') {
        query.user = req.user._id;
      } else {
        // HOD sees department leave requests (faculty and escalated students)
        const hodDept = await resolveHodDepartment(req.user);
        if (hodDept) {
          query.department = hodDept._id;
        }
        if (scope === 'approvals') {
          query.currentApproverRole = ROLES.HOD;
        }
      }
    } else if (req.user.role === ROLES.LIBRARIAN) {
      if (scope === 'approvals') {
        query.currentApproverRole = ROLES.LIBRARIAN;
      } else if (scope === 'my-leaves') {
        query.user = req.user._id;
      } else {
        // Overview of library staff leaves + own
        query.$or = [{ user: req.user._id }, { currentApproverRole: ROLES.LIBRARIAN }];
      }
    } else if (req.user.role === ROLES.LIBRARY_STAFF || req.user.role === ROLES.ACCOUNTS) {
      query.user = req.user._id;
    } else if (req.user.role === ROLES.PRINCIPAL) {
      if (scope === 'my-leaves') {
        query.user = req.user._id;
      } else if (scope === 'approvals') {
        query.currentApproverRole = ROLES.PRINCIPAL;
      }
      // If no scope, Principal can see all institutional leaves
    }
    // Super Admin has full view unless filtered

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status.toLowerCase();
    }

    // Applicant Role filter
    if (req.query.applicantRole && req.query.applicantRole !== 'all') {
      query.applicantRole = req.query.applicantRole.toLowerCase();
    }

    // Department filter (for Principal / Super Admin)
    if (req.query.department && req.query.department !== 'all') {
      const deptVal = String(req.query.department).trim();
      if (mongoose.Types.ObjectId.isValid(deptVal)) {
        query.department = deptVal;
      } else {
        const foundDept = await Department.findOne({
          $or: [{ code: deptVal.toUpperCase() }, { name: deptVal }]
        });
        if (foundDept) {
          query.department = foundDept._id;
        }
      }
    }

    // Leave type filter
    if (req.query.leaveType && req.query.leaveType !== 'all') {
      query.leaveType = req.query.leaveType.toLowerCase();
    }

    // Search by name, roll number, or employee ID
    const search = req.query.search || req.query.q;
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { applicantName: regex },
        { applicantIdNumber: regex },
        { applicationId: regex },
        { reason: regex }
      ];
    }

    // Summary counts query (scoped to user's permissions)
    const baseSummaryQuery = { ...query };
    delete baseSummaryQuery.status;

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let totalCount = 0;

    try {
      [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
        Leave.countDocuments({ ...baseSummaryQuery, status: 'pending' }),
        Leave.countDocuments({ ...baseSummaryQuery, status: 'approved' }),
        Leave.countDocuments({ ...baseSummaryQuery, status: 'rejected' }),
        Leave.countDocuments(baseSummaryQuery)
      ]);
    } catch (e) {
      // Mock fallback
    }

    // Fetch paginated leaves
    const [leaves, totalMatching] = await Promise.all([
      Leave.find(query)
        .populate('faculty', 'employeeId designation qualification dateOfJoining')
        .populate('student', 'rollNumber currentSemester')
        .populate('user', 'name email phone status role')
        .populate('department', 'name code')
        .populate('reviewedBy', 'name email role')
        .populate('currentApprover', 'name email role')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Leave.countDocuments(query)
    ]);

    // Calculate leave days for each item
    const formattedLeaves = leaves.map((lv) => {
      const obj = lv.toObject ? lv.toObject() : { ...lv };
      const start = new Date(lv.startDate);
      const end = new Date(lv.endDate);
      const timeDiff = Math.abs(end.getTime() - start.getTime());
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

      return {
        ...obj,
        id: obj._id,
        applicationId: obj.applicationId || String(obj._id),
        durationDays: isNaN(days) ? (obj.numberOfDays || 1) : days,
        numberOfDays: obj.numberOfDays || days
      };
    });

    return sendSuccess(res, {
      message: 'Leave requests retrieved successfully',
      data: {
        summary: {
          pendingCount,
          approvedCount,
          rejectedCount,
          totalCount
        },
        leaves: formattedLeaves,
        pagination: {
          page,
          limit,
          total: totalMatching,
          totalPages: Math.ceil(totalMatching / limit) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Single Leave Request by ID
 */
async function getLeaveRequestById(req, res, next) {
  try {
    const cleanId = String(req.params.id || '').trim();
    let leave = null;

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      leave = await Leave.findById(cleanId)
        .populate('faculty', 'employeeId designation qualification specialization')
        .populate('student', 'rollNumber currentSemester')
        .populate('user', 'name email phone status role')
        .populate('department', 'name code')
        .populate('reviewedBy', 'name email role')
        .populate('currentApprover', 'name email role')
        .populate('approvalHistory.approver', 'name email role');
    }

    if (!leave) {
      leave = await Leave.findOne({ applicationId: cleanId })
        .populate('faculty', 'employeeId designation qualification specialization')
        .populate('student', 'rollNumber currentSemester')
        .populate('user', 'name email phone status role')
        .populate('department', 'name code')
        .populate('reviewedBy', 'name email role')
        .populate('currentApprover', 'name email role')
        .populate('approvalHistory.approver', 'name email role');
    }

    if (!leave) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Leave request not found',
        code: 'NOT_FOUND'
      });
    }

    // Role-based authorization & ownership check
    const isApplicant = leave.user?._id
      ? leave.user._id.toString() === req.user._id.toString()
      : leave.user?.toString() === req.user._id.toString();

    if (!isApplicant) {
      if (req.user.role === ROLES.STUDENT) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: Students can only view their own leave requests',
          code: 'FORBIDDEN'
        });
      } else if (req.user.role === ROLES.FACULTY) {
        // Teacher can view if assigned approver or student in their department
        const isApprover = leave.currentApproverRole === ROLES.FACULTY;
        if (!isApprover && leave.applicantRole !== ROLES.STUDENT) {
          return sendError(res, {
            statusCode: HTTP_STATUS.FORBIDDEN,
            message: 'Forbidden: Faculty can only view their own or assigned student leave requests',
            code: 'FORBIDDEN'
          });
        }
      } else if (req.user.role === ROLES.HOD) {
        const hodDept = await resolveHodDepartment(req.user);
        if (hodDept && leave.department) {
          const leaveDeptId = leave.department._id ? leave.department._id.toString() : leave.department.toString();
          if (hodDept._id.toString() !== leaveDeptId) {
            return sendError(res, {
              statusCode: HTTP_STATUS.FORBIDDEN,
              message: 'Forbidden: HOD can only view leave requests for their own department',
              code: 'FORBIDDEN'
            });
          }
        }
      }
    }

    const resObj = leave.toObject ? leave.toObject() : { ...leave };
    resObj.id = resObj._id;
    resObj.applicationId = resObj.applicationId || String(resObj._id);

    return sendSuccess(res, { data: resObj });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit Role-Based Leave Application
 */
async function applyLeave(req, res, next) {
  try {
    const { leaveType, startDate, endDate, reason, documentUrl } = req.body;
    const applicantRole = req.user.role;
    const applicantName = req.user.name;

    let facultyDoc = null;
    let studentDoc = null;
    let departmentId = null;
    let applicantIdNumber = req.user.email;
    let academicClass = '';

    // Auto-populate identity based on role
    if (applicantRole === ROLES.STUDENT) {
      studentDoc = await Student.findOne({ user: req.user._id }).populate('department course');
      if (studentDoc) {
        departmentId = studentDoc.department?._id || studentDoc.department;
        applicantIdNumber = studentDoc.rollNumber || req.user.email;
        academicClass = `Semester ${studentDoc.currentSemester || 1}${studentDoc.section ? ` - Sec ${studentDoc.section}` : ''}`;
      }
    } else if (applicantRole === ROLES.FACULTY) {
      let fId = req.body.facultyId;
      if (fId) facultyDoc = await Faculty.findById(fId);
      else facultyDoc = await Faculty.findOne({ user: req.user._id });

      if (facultyDoc) {
        departmentId = facultyDoc.department?._id || facultyDoc.department;
        applicantIdNumber = facultyDoc.employeeId || req.user.email;
        academicClass = facultyDoc.designation || 'Faculty Member';
      }
    } else if (applicantRole === ROLES.HOD) {
      facultyDoc = await Faculty.findOne({ user: req.user._id });
      if (facultyDoc) {
        departmentId = facultyDoc.department?._id || facultyDoc.department;
        applicantIdNumber = facultyDoc.employeeId || req.user.email;
      }
      academicClass = 'Head of Department';
    } else if (applicantRole === ROLES.LIBRARY_STAFF) {
      academicClass = 'Library Circulation Staff';
    } else if (applicantRole === ROLES.LIBRARIAN) {
      academicClass = 'Chief Librarian';
    } else if (applicantRole === ROLES.ACCOUNTS) {
      academicClass = 'Accounts & Finance Officer';
    } else if (applicantRole === ROLES.PRINCIPAL) {
      academicClass = 'Executive Principal';
    } else {
      academicClass = 'Institutional Administrator';
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const numberOfDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);

    // Resolve initial approver hierarchy
    const maxStages = resolveMaxStages(applicantRole, numberOfDays);
    const currentApproverRole = getApproverRoleForStage(applicantRole, 1);
    const approverUser = await resolveApproverUser({
      applicantUser: req.user,
      applicantRole,
      departmentId,
      stageNumber: 1
    });

    const applicationId = `LV-${Date.now().toString().slice(-6)}`;

    const initialHistoryItem = {
      stage: 1,
      approverRole: currentApproverRole,
      approverName: approverUser ? approverUser.name : `${currentApproverRole.toUpperCase()} Authority`,
      action: 'submitted',
      remarks: 'Leave application submitted for approval',
      timestamp: new Date(),
      previousStatus: 'draft',
      updatedStatus: 'pending'
    };
    if (approverUser?._id) {
      initialHistoryItem.approver = approverUser._id;
    }

    const leave = await Leave.create({
      applicationId,
      user: req.user._id,
      applicantRole,
      applicantName,
      applicantIdNumber,
      academicClass,
      faculty: facultyDoc ? facultyDoc._id : undefined,
      student: studentDoc ? studentDoc._id : undefined,
      department: departmentId || undefined,
      leaveType: leaveType || 'casual',
      startDate: start,
      endDate: end,
      numberOfDays,
      reason,
      documentUrl,
      status: 'pending',
      currentApproverRole,
      currentApprover: approverUser ? approverUser._id : undefined,
      approvalStage: 1,
      maxApprovalStages: maxStages,
      approvalHistory: [initialHistoryItem]
    });

    await recordAuditLog({
      req,
      action: 'LEAVE_REQUEST_SUBMITTED',
      entityType: 'Leave',
      entityId: leave._id,
      details: {
        applicationId,
        applicantRole,
        leaveType: leave.leaveType,
        numberOfDays,
        currentApproverRole
      }
    });

    await createLeaveNotification({
      title: `New Leave Request: ${applicantName || 'Staff/Student'}`,
      content: `${applicantName || 'Applicant'} (${applicantRole}) applied for ${numberOfDays} day(s) of ${leave.leaveType} leave. Review required.`,
      targetRoles: currentApproverRole ? [currentApproverRole] : ['*'],
      department: departmentId,
      author: req.user._id,
      priority: numberOfDays > 3 ? 'urgent' : 'normal'
    });

    const resObj = leave.toObject ? leave.toObject() : { ...leave };
    resObj.id = resObj._id;
    resObj.durationDays = numberOfDays;

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Leave application submitted successfully',
      data: resObj
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Review Leave Request (Approve / Reject / Forward)
 */
async function reviewLeave(req, res, next) {
  try {
    const rawStatus = (req.body.status || req.body.decision || req.body.action || '').toString().toLowerCase().trim();
    const status = rawStatus === 'approve' ? 'approved' : rawStatus === 'reject' ? 'rejected' : rawStatus;
    const rejectionReason = (req.body.rejectionReason || req.body.reason || req.body.remarks || req.body.comments || '').toString().trim();
    const remarks = (req.body.remarks || req.body.comments || '').toString().trim();

    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: "Status must be either 'approved' or 'rejected'",
        code: 'INVALID_STATUS'
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Rejection reason is mandatory when rejecting a leave request',
        code: 'REJECTION_REASON_REQUIRED'
      });
    }

    const cleanId = String(req.params.id || '').trim();
    let existingLeave = null;

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      existingLeave = await Leave.findById(cleanId);
    }
    if (!existingLeave) {
      existingLeave = await Leave.findOne({ applicationId: cleanId });
    }

    if (!existingLeave) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Leave application not found',
        code: 'LEAVE_NOT_FOUND'
      });
    }

    // 1. Prevent applicants from approving their own requests
    if (existingLeave.user && req.user && existingLeave.user.toString() === req.user._id.toString()) {
      return sendError(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: 'Forbidden: You cannot review or approve your own leave application',
        code: 'CANNOT_APPROVE_OWN_LEAVE'
      });
    }

    // 2. Role-based review authorization
    if (req.user.role === ROLES.FACULTY) {
      // Faculty can only review student leave requests
      if (existingLeave.applicantRole !== ROLES.STUDENT) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: Faculty can only review student leave requests',
          code: 'FORBIDDEN'
        });
      }
    } else if (req.user.role === ROLES.HOD) {
      // HOD can review department leaves
      const hodDept = await resolveHodDepartment(req.user);
      if (hodDept && existingLeave.department) {
        const leaveDeptId = existingLeave.department.toString();
        if (hodDept._id.toString() !== leaveDeptId && req.user.role !== ROLES.SUPER_ADMIN) {
          return sendError(res, {
            statusCode: HTTP_STATUS.FORBIDDEN,
            message: 'Forbidden: HOD can only review leave requests within their department',
            code: 'FORBIDDEN'
          });
        }
      }
    } else if (req.user.role === ROLES.LIBRARIAN) {
      if (existingLeave.applicantRole !== ROLES.LIBRARY_STAFF && req.user.role !== ROLES.SUPER_ADMIN) {
        return sendError(res, {
          statusCode: HTTP_STATUS.FORBIDDEN,
          message: 'Forbidden: Librarian can only review library staff leave requests',
          code: 'FORBIDDEN'
        });
      }
    }

    // 3. Multi-level workflow progression
    const currentStage = existingLeave.approvalStage || 1;
    const maxStages = existingLeave.maxApprovalStages || 1;
    const hasNextStage = status === 'approved' && currentStage < maxStages;

    let updatedStatus = status;
    let nextApproverRole = existingLeave.currentApproverRole;
    let nextApproverUser = existingLeave.currentApprover;

    if (hasNextStage) {
      updatedStatus = 'pending'; // Forwarded to next stage
      const nextStageNum = currentStage + 1;
      nextApproverRole = getApproverRoleForStage(existingLeave.applicantRole, nextStageNum);
      const resolved = await resolveApproverUser({
        applicantUser: null,
        applicantRole: existingLeave.applicantRole,
        departmentId: existingLeave.department,
        stageNumber: nextStageNum
      });
      if (resolved) nextApproverUser = resolved._id;
    }

    const historyEntry = {
      stage: currentStage,
      approver: req.user._id,
      approverRole: req.user.role,
      approverName: req.user.name,
      action: status === 'rejected' ? 'rejected' : hasNextStage ? 'forwarded' : 'approved',
      remarks: status === 'rejected' ? rejectionReason : remarks || (hasNextStage ? `Recommended and forwarded to ${nextApproverRole.toUpperCase()}` : 'Approved'),
      timestamp: new Date(),
      previousStatus: existingLeave.status,
      updatedStatus
    };

    const updateSet = {
      status: updatedStatus,
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    };

    if (status === 'rejected') {
      updateSet.rejectionReason = rejectionReason;
      updateSet.remarks = remarks || rejectionReason;
    } else {
      updateSet.remarks = remarks || (hasNextStage ? `Forwarded to ${nextApproverRole.toUpperCase()}` : 'Approved');
      if (hasNextStage) {
        updateSet.approvalStage = currentStage + 1;
        updateSet.currentApproverRole = nextApproverRole;
        if (nextApproverUser) updateSet.currentApprover = nextApproverUser;
      }
    }

    // Atomic update targeting status: 'pending' to ensure concurrency safety
    const updatedLeave = await Leave.findOneAndUpdate(
      { _id: existingLeave._id, status: 'pending' },
      {
        $set: updateSet,
        $push: { approvalHistory: historyEntry }
      },
      { new: true }
    )
      .populate('faculty', 'employeeId designation')
      .populate('student', 'rollNumber currentSemester')
      .populate('user', 'name email role')
      .populate('department', 'name code')
      .populate('reviewedBy', 'name email role')
      .populate('currentApprover', 'name email role')
      .populate('approvalHistory.approver', 'name email role');

    if (!updatedLeave) {
      const refreshed = await Leave.findById(existingLeave._id);
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `Leave request has already been ${refreshed?.status || 'processed'} and cannot be modified`,
        code: 'LEAVE_ALREADY_REVIEWED'
      });
    }

    await recordAuditLog({
      req,
      action: status === 'approved' ? (hasNextStage ? 'LEAVE_REQUEST_FORWARDED' : 'LEAVE_REQUEST_APPROVED') : 'LEAVE_REQUEST_REJECTED',
      entityType: 'Leave',
      entityId: updatedLeave._id,
      details: {
        applicationId: updatedLeave.applicationId,
        decision: status,
        action: historyEntry.action,
        reviewedBy: req.user._id,
        remarks: historyEntry.remarks
      }
    });

    if (status === 'approved') {
      if (hasNextStage) {
        await createLeaveNotification({
          title: `Leave Request Forwarded: ${updatedLeave.applicantName}`,
          content: `Leave application for ${updatedLeave.applicantName} (${updatedLeave.applicantRole}) was approved at Stage ${currentStage} and forwarded to ${nextApproverRole.toUpperCase()} for next-level approval.`,
          targetRoles: nextApproverRole ? [nextApproverRole] : ['*'],
          department: updatedLeave.department,
          author: req.user._id,
          priority: 'urgent'
        });
      } else {
        await createLeaveNotification({
          title: 'Leave Application Approved',
          content: `Your ${updatedLeave.leaveType} leave application (${updatedLeave.applicationId || updatedLeave._id}) has been fully approved. Remarks: ${remarks || 'Approved'}`,
          targetRoles: updatedLeave.applicantRole ? [updatedLeave.applicantRole] : ['*'],
          department: updatedLeave.department,
          author: req.user._id,
          priority: 'normal'
        });
      }
    } else {
      await createLeaveNotification({
        title: 'Leave Application Rejected',
        content: `Your ${updatedLeave.leaveType} leave application (${updatedLeave.applicationId || updatedLeave._id}) was rejected. Reason: ${rejectionReason}`,
        targetRoles: updatedLeave.applicantRole ? [updatedLeave.applicantRole] : ['*'],
        department: updatedLeave.department,
        author: req.user._id,
        priority: 'urgent'
      });
    }

    const resObj = updatedLeave.toObject ? updatedLeave.toObject() : { ...updatedLeave };
    resObj.id = resObj._id;

    return sendSuccess(res, {
      message: hasNextStage
        ? `Leave request approved at Stage ${currentStage} and forwarded to ${nextApproverRole.toUpperCase()}`
        : `Leave request has been successfully ${status}`,
      data: resObj
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Escalate Leave Request to Higher Level Authority
 */
async function escalateLeave(req, res, next) {
  try {
    const cleanId = String(req.params.id || '').trim();
    const { remarks } = req.body;

    const leave = await Leave.findById(cleanId);
    if (!leave) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Leave request not found',
        code: 'NOT_FOUND'
      });
    }

    if (leave.status !== 'pending') {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Only pending leave requests can be escalated',
        code: 'INVALID_STATUS'
      });
    }

    // Prevent duplicate immediate escalation
    const lastHistory = leave.approvalHistory?.[leave.approvalHistory.length - 1];
    if (
      lastHistory &&
      lastHistory.action === 'escalated' &&
      Date.now() - new Date(lastHistory.timestamp).getTime() < 60000
    ) {
      return sendError(res, {
        statusCode: HTTP_STATUS.CONFLICT,
        message: 'A duplicate escalation was recently processed for this request. Please wait before escalating again.',
        code: 'DUPLICATE_ESCALATION'
      });
    }

    if (leave.currentApproverRole === ROLES.SUPER_ADMIN) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Leave request is already at the highest institutional authority level (Super Admin) and cannot be escalated further',
        code: 'MAX_ESCALATION_REACHED'
      });
    }

    // Determine escalated approver role
    let nextRole = ROLES.PRINCIPAL;
    if (leave.currentApproverRole === ROLES.FACULTY) {
      nextRole = ROLES.HOD;
    } else if (leave.currentApproverRole === ROLES.HOD || leave.currentApproverRole === ROLES.LIBRARIAN) {
      nextRole = ROLES.PRINCIPAL;
    } else if (leave.currentApproverRole === ROLES.PRINCIPAL) {
      nextRole = ROLES.SUPER_ADMIN;
    }

    const nextUser = await resolveApproverUser({
      applicantUser: null,
      applicantRole: leave.applicantRole,
      departmentId: leave.department,
      stageNumber: (leave.approvalStage || 1) + 1
    });

    const historyEntry = {
      stage: leave.approvalStage || 1,
      approver: req.user._id,
      approverRole: req.user.role,
      approverName: req.user.name,
      action: 'escalated',
      remarks: remarks || `Administrative escalation to ${nextRole.toUpperCase()}`,
      timestamp: new Date(),
      previousStatus: leave.status,
      updatedStatus: 'pending'
    };

    leave.currentApproverRole = nextRole;
    if (nextUser) leave.currentApprover = nextUser._id;
    leave.approvalHistory.push(historyEntry);
    await leave.save();

    await recordAuditLog({
      req,
      action: 'LEAVE_REQUEST_ESCALATED',
      entityType: 'Leave',
      entityId: leave._id,
      details: {
        applicationId: leave.applicationId,
        escalatedTo: nextRole,
        escalatedBy: req.user._id
      }
    });

    await createLeaveNotification({
      title: `Urgent Escalation: Leave Request for ${leave.applicantName}`,
      content: `Leave application (${leave.applicationId || leave._id}) has been escalated to ${nextRole.toUpperCase()}. Remarks: ${remarks || 'Administrative escalation'}`,
      targetRoles: [nextRole],
      department: leave.department,
      author: req.user._id,
      priority: 'urgent'
    });

    return sendSuccess(res, {
      message: `Leave request has been escalated to ${nextRole.toUpperCase()}`,
      data: leave
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Active Leave Workflow Configuration
 */
function getWorkflowConfig(req, res) {
  return sendSuccess(res, {
    message: 'Active leave approval workflows retrieved successfully',
    data: getActiveWorkflows()
  });
}

/**
 * Update Leave Workflow Configuration (Super Admin only)
 */
function updateWorkflowConfig(req, res) {
  const updated = updateActiveWorkflows(req.body);
  return sendSuccess(res, {
    message: 'Leave approval workflows updated successfully',
    data: updated
  });
}

/**
 * GET /api/v1/leaves/escalations
 * SLA monitoring and overdue escalation candidate detection
 */
async function getWorkflowEscalations(req, res, next) {
  try {
    const query = { status: 'pending' };

    // Scoping
    if (req.user.role === ROLES.HOD) {
      const hodDept = await resolveHodDepartment(req.user);
      if (hodDept) query.department = hodDept._id;
    }

    const pendingLeaves = await Leave.find(query)
      .populate('applicant', 'name email role')
      .populate('department', 'name code')
      .populate('currentApprover', 'name email role')
      .sort({ createdAt: 1 })
      .lean();

    const standardSlaHours = 48; // 48-hour SLA standard for institutional approvals

    const tasks = pendingLeaves.map((leave) => {
      const createdTime = new Date(leave.createdAt).getTime();
      const elapsedHours = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60));
      const isOverdue = elapsedHours >= standardSlaHours;
      const slaRemainingHours = Math.max(0, standardSlaHours - elapsedHours);

      const escalationHistory = (leave.approvalHistory || []).filter((h) => h.action === 'escalated');

      return {
        id: leave._id,
        applicationId: leave.applicationId,
        applicantName: leave.applicantName || leave.applicant?.name,
        applicantRole: leave.applicantRole,
        department: leave.department?.name,
        leaveType: leave.leaveType,
        numberOfDays: leave.numberOfDays,
        approvalStage: leave.approvalStage,
        currentApproverRole: leave.currentApproverRole,
        currentApproverName: leave.currentApprover?.name || null,
        createdAt: leave.createdAt,
        sla: {
          standardHours: standardSlaHours,
          elapsedHours,
          remainingHours: slaRemainingHours,
          isOverdue,
          slaBreached: elapsedHours > standardSlaHours
        },
        escalationHistoryCount: escalationHistory.length,
        canEscalate: leave.currentApproverRole !== ROLES.SUPER_ADMIN
      };
    });

    const overdueTasks = tasks.filter((t) => t.sla.isOverdue);

    return sendSuccess(res, {
      message: 'Workflow SLA monitoring telemetry retrieved',
      data: {
        timestamp: new Date().toISOString(),
        summary: {
          totalPendingTasks: tasks.length,
          overdueSlaTasks: overdueTasks.length,
          onTrackTasks: tasks.length - overdueTasks.length
        },
        overdueTasks,
        allPendingTasks: tasks
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listLeaveRequests,
  getLeaveRequestById,
  applyLeave,
  reviewLeave,
  escalateLeave,
  getWorkflowConfig,
  updateWorkflowConfig,
  getWorkflowEscalations
};
