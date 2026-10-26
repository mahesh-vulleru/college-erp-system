const HTTP_STATUS = Object.freeze({
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

const DEPARTMENTS = Object.freeze([
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology'
]);

const ACADEMIC_SEMESTERS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);

const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
});

module.exports = {
  HTTP_STATUS,
  DEPARTMENTS,
  ACADEMIC_SEMESTERS,
  USER_STATUS
};
