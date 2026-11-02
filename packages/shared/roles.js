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
<<<<<<< HEAD
  LIBRARIAN: 'librarian'
=======
  LIBRARIAN: 'librarian',
  LIBRARY_STAFF: 'library_staff'
>>>>>>> feature/library-staff-portal
});

const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Administrator',
  [ROLES.PRINCIPAL]: 'Principal / Management',
  [ROLES.HOD]: 'Head of Department',
  [ROLES.FACULTY]: 'Faculty Member',
  [ROLES.STUDENT]: 'Student',
  [ROLES.ACCOUNTS]: 'Accounts & Finance Officer',
<<<<<<< HEAD
  [ROLES.LIBRARIAN]: 'Chief Librarian'
=======
  [ROLES.LIBRARIAN]: 'Chief Librarian',
  [ROLES.LIBRARY_STAFF]: 'Library Staff'
>>>>>>> feature/library-staff-portal
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ROLE_LABELS,
  ALL_ROLES
};
