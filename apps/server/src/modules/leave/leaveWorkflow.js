const mongoose = require('mongoose');
const { ROLES } = require('@college-erp/shared');
const User = require('../auth/auth.model');
const Faculty = require('../faculty/faculty.model');
const Student = require('../students/student.model');
const Department = require('../departments/department.model');

// Default institutional leave approval workflows
const DEFAULT_WORKFLOWS = {
  [ROLES.STUDENT]: {
    stages: [
      { stage: 1, approverRole: ROLES.FACULTY, title: 'Class Teacher / Faculty Mentor', required: true },
      { stage: 2, approverRole: ROLES.HOD, title: 'Head of Department', requireApprovalAboveDays: 3 }
    ]
  },
  [ROLES.FACULTY]: {
    stages: [
      { stage: 1, approverRole: ROLES.HOD, title: 'Head of Department', required: true },
      { stage: 2, approverRole: ROLES.PRINCIPAL, title: 'Principal / Management', requireApprovalAboveDays: 5 }
    ]
  },
  [ROLES.HOD]: {
    stages: [
      { stage: 1, approverRole: ROLES.PRINCIPAL, title: 'Principal / Executive Authority', required: true }
    ]
  },
  [ROLES.LIBRARY_STAFF]: {
    stages: [
      { stage: 1, approverRole: ROLES.LIBRARIAN, title: 'Chief Librarian', required: true },
      { stage: 2, approverRole: ROLES.PRINCIPAL, title: 'Principal', requireApprovalAboveDays: 3 }
    ]
  },
  [ROLES.LIBRARIAN]: {
    stages: [
      { stage: 1, approverRole: ROLES.PRINCIPAL, title: 'Principal / Executive Authority', required: true }
    ]
  },
  [ROLES.ACCOUNTS]: {
    stages: [
      { stage: 1, approverRole: ROLES.PRINCIPAL, title: 'Principal / Finance Authority', required: true }
    ]
  },
  [ROLES.BUS_DRIVER]: {
    stages: [
      { stage: 1, approverRole: ROLES.TRANSPORT_SUPERVISOR, title: 'Transport Supervisor', required: true },
      { stage: 2, approverRole: ROLES.TRANSPORT_ADMIN, title: 'Transport Administrator', requireApprovalAboveDays: 3 }
    ]
  },
  [ROLES.BUS_ATTENDANT]: {
    stages: [
      { stage: 1, approverRole: ROLES.TRANSPORT_SUPERVISOR, title: 'Transport Supervisor', required: true },
      { stage: 2, approverRole: ROLES.TRANSPORT_ADMIN, title: 'Transport Administrator', requireApprovalAboveDays: 3 }
    ]
  },
  [ROLES.TRANSPORT_SUPERVISOR]: {
    stages: [
      { stage: 1, approverRole: ROLES.TRANSPORT_ADMIN, title: 'Transport Administrator', required: true }
    ]
  },
  [ROLES.TRANSPORT_ADMIN]: {
    stages: [
      { stage: 1, approverRole: ROLES.PRINCIPAL, title: 'Principal / Executive Authority', required: true }
    ]
  },
  [ROLES.PRINCIPAL]: {
    stages: [
      { stage: 1, approverRole: ROLES.SUPER_ADMIN, title: 'Management Authority', required: true }
    ]
  },
  [ROLES.SUPER_ADMIN]: {
    stages: [
      { stage: 1, approverRole: ROLES.SUPER_ADMIN, title: 'Institutional Authority', required: true }
    ]
  }
};

let activeWorkflows = JSON.parse(JSON.stringify(DEFAULT_WORKFLOWS));

function getActiveWorkflows() {
  return activeWorkflows;
}

function updateActiveWorkflows(newWorkflows) {
  activeWorkflows = { ...activeWorkflows, ...newWorkflows };
  return activeWorkflows;
}

function resetWorkflowsToDefault() {
  activeWorkflows = JSON.parse(JSON.stringify(DEFAULT_WORKFLOWS));
  return activeWorkflows;
}

/**
 * Resolve maximum approval stages needed based on applicant role and duration
 */
function resolveMaxStages(role, numberOfDays = 1) {
  const config = activeWorkflows[role] || DEFAULT_WORKFLOWS[role] || { stages: [{ stage: 1, approverRole: ROLES.PRINCIPAL }] };
  const stages = config.stages || [];
  if (stages.length <= 1) return 1;

  const stage2 = stages[1];
  if (stage2.requireApprovalAboveDays && numberOfDays <= stage2.requireApprovalAboveDays) {
    return 1;
  }
  return stages.length;
}

/**
 * Determine the approver role for a specific stage
 */
function getApproverRoleForStage(applicantRole, stageNumber) {
  const config = activeWorkflows[applicantRole] || DEFAULT_WORKFLOWS[applicantRole];
  const stages = config?.stages || [];
  const found = stages.find((s) => s.stage === stageNumber);
  if (found) return found.approverRole;
  if (stages.length > 0) return stages[stages.length - 1].approverRole;
  return ROLES.PRINCIPAL;
}

/**
 * Dynamically resolve the designated approver User entity
 */
async function resolveApproverUser({ applicantUser, applicantRole, departmentId, stageNumber }) {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }
  const approverRole = getApproverRoleForStage(applicantRole, stageNumber);

  try {
    if (approverRole === ROLES.FACULTY) {
      if (departmentId) {
        const deptFaculty = await Faculty.findOne({ department: departmentId }).populate('user');
        if (deptFaculty?.user) return deptFaculty.user;
      }
      const anyFaculty = await Faculty.findOne().populate('user');
      if (anyFaculty?.user) return anyFaculty.user;
    } else if (approverRole === ROLES.HOD) {
      if (departmentId) {
        const dept = await Department.findById(departmentId).populate('hod');
        if (dept?.hod) return dept.hod;
      }
      const hodUser = await User.findOne({ role: ROLES.HOD, status: 'active' });
      if (hodUser) return hodUser;
    } else if (approverRole === ROLES.TRANSPORT_SUPERVISOR) {
      const supervisor = await User.findOne({ role: ROLES.TRANSPORT_SUPERVISOR, status: 'active' });
      if (supervisor) return supervisor;
    } else if (approverRole === ROLES.TRANSPORT_ADMIN) {
      const transportAdmin = await User.findOne({ role: ROLES.TRANSPORT_ADMIN, status: 'active' });
      if (transportAdmin) return transportAdmin;
    } else if (approverRole === ROLES.LIBRARIAN) {
      const librarianUser = await User.findOne({ role: ROLES.LIBRARIAN, status: 'active' });
      if (librarianUser) return librarianUser;
    } else if (approverRole === ROLES.PRINCIPAL) {
      const principalUser = await User.findOne({ role: ROLES.PRINCIPAL, status: 'active' });
      if (principalUser) return principalUser;
    } else if (approverRole === ROLES.SUPER_ADMIN) {
      const adminUser = await User.findOne({ role: ROLES.SUPER_ADMIN, status: 'active' });
      if (adminUser) return adminUser;
    }
  } catch (err) {
    console.error('Error resolving approver user:', err.message);
  }

  return null;
}

/**
 * Determine the initial approver for a leave request based on applicant's profile
 */
async function determineInitialApprover(applicantUser, leaveType, daysCount) {
  const workflow = activeWorkflows[applicantUser.role];
  if (!workflow || !workflow.stages || workflow.stages.length === 0) {
    // Default to Principal or Super Admin
    const principal = await User.findOne({ role: ROLES.PRINCIPAL });
    return {
      stage: 1,
      approverRole: ROLES.PRINCIPAL,
      approverUser: principal ? principal._id : null
    };
  }

  const stage1 = workflow.stages[0];

  // Specific entity logic
  if (applicantUser.role === ROLES.STUDENT) {
    const student = await Student.findOne({ user: applicantUser._id }).populate('department');
    if (student && student.department) {
      // Find a faculty member in this department
      const faculty = await Faculty.findOne({ department: student.department._id });
      if (faculty && faculty.user) {
        return {
          stage: 1,
          approverRole: ROLES.FACULTY,
          approverUser: faculty.user
        };
      }
    }
  } else if (applicantUser.role === ROLES.FACULTY) {
    const faculty = await Faculty.findOne({ user: applicantUser._id });
    if (faculty && faculty.department) {
      // Find HOD for this department
      const hod = await User.findOne({ role: ROLES.HOD });
      if (hod) {
        return {
          stage: 1,
          approverRole: ROLES.HOD,
          approverUser: hod._id
        };
      }
    }
  } else if (applicantUser.role === ROLES.BUS_DRIVER || applicantUser.role === ROLES.BUS_ATTENDANT) {
    const supervisor = await User.findOne({ role: ROLES.TRANSPORT_SUPERVISOR });
    if (supervisor) {
      return {
        stage: 1,
        approverRole: ROLES.TRANSPORT_SUPERVISOR,
        approverUser: supervisor._id
      };
    }
  } else if (applicantUser.role === ROLES.TRANSPORT_SUPERVISOR) {
    const admin = await User.findOne({ role: ROLES.TRANSPORT_ADMIN });
    if (admin) {
      return {
        stage: 1,
        approverRole: ROLES.TRANSPORT_ADMIN,
        approverUser: admin._id
      };
    }
  }

  // Fallback to role-based user lookup
  const approver = await User.findOne({ role: stage1.approverRole });
  return {
    stage: 1,
    approverRole: stage1.approverRole,
    approverUser: approver ? approver._id : null
  };
}

module.exports = {
  DEFAULT_WORKFLOWS,
  getActiveWorkflows,
  updateActiveWorkflows,
  resetWorkflowsToDefault,
  resolveMaxStages,
  getApproverRoleForStage,
  resolveApproverUser,
  determineInitialApprover
};
