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
  ACCOUNTS: 'accounts',
  LIBRARIAN: 'librarian',
  LIBRARY_STAFF: 'library_staff',
  TRANSPORT_ADMIN: 'transport_admin',
  TRANSPORT_SUPERVISOR: 'transport_supervisor',
  BUS_DRIVER: 'bus_driver',
  BUS_ATTENDANT: 'bus_attendant',
  PARENT: 'parent'
});

const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Administrator',
  [ROLES.PRINCIPAL]: 'Principal / Management',
  [ROLES.HOD]: 'Head of Department',
  [ROLES.FACULTY]: 'Faculty Member',
  [ROLES.STUDENT]: 'Student',
  [ROLES.ACCOUNTS]: 'Accounts & Finance Officer',
  [ROLES.LIBRARIAN]: 'Chief Librarian',
  [ROLES.LIBRARY_STAFF]: 'Library Staff',
  [ROLES.TRANSPORT_ADMIN]: 'Transport Administrator',
  [ROLES.TRANSPORT_SUPERVISOR]: 'Transport Supervisor',
  [ROLES.BUS_DRIVER]: 'Bus Driver',
  [ROLES.BUS_ATTENDANT]: 'Bus Attendant',
  [ROLES.PARENT]: 'Parent / Guardian'
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ROLE_LABELS,
  ALL_ROLES
};
