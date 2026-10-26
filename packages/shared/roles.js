/**
 * College ERP Role Definitions
 * Strictly controlled server-side roles for access control.
 */
const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  PRINCIPAL: 'principal',
  HOD: 'hod',
  FACULTY: 'faculty',
  STUDENT: 'student',
  ACCOUNTS: 'accounts'
});

const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Administrator',
  [ROLES.PRINCIPAL]: 'Principal / Management',
  [ROLES.HOD]: 'Head of Department',
  [ROLES.FACULTY]: 'Faculty Member',
  [ROLES.STUDENT]: 'Student',
  [ROLES.ACCOUNTS]: 'Accounts & Finance Officer'
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ROLE_LABELS,
  ALL_ROLES
};
