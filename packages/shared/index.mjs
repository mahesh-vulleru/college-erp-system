export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  PRINCIPAL: 'principal',
  HOD: 'hod',
  FACULTY: 'faculty',
  STUDENT: 'student',
  ACCOUNTS: 'accounts'
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Administrator',
  [ROLES.PRINCIPAL]: 'Principal / Management',
  [ROLES.HOD]: 'Head of Department',
  [ROLES.FACULTY]: 'Faculty Member',
  [ROLES.STUDENT]: 'Student',
  [ROLES.ACCOUNTS]: 'Accounts & Finance Officer'
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));

export const PERMISSIONS = Object.freeze({
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  ACADEMIC_SETUP: 'academic:setup',
  COURSE_MANAGE: 'course:manage',
  SUBJECT_MANAGE: 'subject:manage',
  STUDENT_ENROLL: 'student:enroll',
  ATTENDANCE_MARK: 'attendance:mark',
  ATTENDANCE_VIEW_DEPT: 'attendance:view_dept',
  ATTENDANCE_VIEW_SELF: 'attendance:view_self',
  MARKS_ENTRY: 'marks:entry',
  MARKS_APPROVE: 'marks:approve',
  MARKS_VIEW_SELF: 'marks:view_self',
  FEE_STRUCTURE_MANAGE: 'fee:manage_structure',
  FEE_PAYMENT_COLLECT: 'fee:collect',
  FEE_REPORTS_VIEW: 'fee:view_reports',
  FEE_VIEW_SELF: 'fee:view_self',
  SYSTEM_AUDIT_LOGS: 'system:audit_logs',
  SYSTEM_SETTINGS: 'system:settings'
});

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.PRINCIPAL]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.ACADEMIC_SETUP,
    PERMISSIONS.COURSE_MANAGE,
    PERMISSIONS.SUBJECT_MANAGE,
    PERMISSIONS.ATTENDANCE_VIEW_DEPT,
    PERMISSIONS.MARKS_APPROVE,
    PERMISSIONS.FEE_REPORTS_VIEW,
    PERMISSIONS.SYSTEM_AUDIT_LOGS
  ],
  [ROLES.HOD]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.COURSE_MANAGE,
    PERMISSIONS.SUBJECT_MANAGE,
    PERMISSIONS.STUDENT_ENROLL,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ATTENDANCE_VIEW_DEPT,
    PERMISSIONS.MARKS_ENTRY,
    PERMISSIONS.MARKS_APPROVE
  ],
  [ROLES.FACULTY]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.MARKS_ENTRY
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.ATTENDANCE_VIEW_SELF,
    PERMISSIONS.MARKS_VIEW_SELF,
    PERMISSIONS.FEE_VIEW_SELF
  ],
  [ROLES.ACCOUNTS]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.FEE_STRUCTURE_MANAGE,
    PERMISSIONS.FEE_PAYMENT_COLLECT,
    PERMISSIONS.FEE_REPORTS_VIEW
  ]
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
});

export const DEPARTMENTS = Object.freeze([
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology'
]);

export const ACADEMIC_SEMESTERS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  DISABLED: 'disabled',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
});

export default {
  ROLES,
  ROLE_LABELS,
  ALL_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  HTTP_STATUS,
  DEPARTMENTS,
  ACADEMIC_SEMESTERS,
  USER_STATUS
};
