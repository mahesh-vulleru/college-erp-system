const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Universal API Client with automatic Authorization Bearer header injection
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getToken() {
    return localStorage.getItem('college_erp_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.status === 401 && endpoint !== '/v1/auth/login') {
        localStorage.removeItem('college_erp_token');
        localStorage.removeItem('college_erp_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Common authentication endpoints
  checkHealth() {
    return this.get('/health');
  }

  login(credentials) {
    return this.post('/v1/auth/login', credentials);
  }

  getCurrentUser() {
    return this.get('/v1/auth/me');
  }

  changePassword(currentPassword, newPassword) {
    return this.post('/v1/auth/change-password', { currentPassword, newPassword });
  }

  // User Management endpoints (Super Admin)
  getUsers(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.role) searchParams.append('role', params.role);
    if (params.department) searchParams.append('department', params.department);
    if (params.status) searchParams.append('status', params.status);
    if (params.q) searchParams.append('q', params.q);

    const qs = searchParams.toString();
    return this.get(`/v1/users${qs ? `?${qs}` : ''}`);
  }

  getUserById(id) {
    return this.get(`/v1/users/${id}`);
  }

  createUser(userData) {
    return this.post('/v1/users', userData);
  }

  updateUser(id, userData) {
    return this.put(`/v1/users/${id}`, userData);
  }

  updateUserStatus(id, status) {
    return this.patch(`/v1/users/${id}/status`, { status });
  }

  resetUserPassword(id, newPassword) {
    return this.post(`/v1/users/${id}/reset-password`, { newPassword });
  }

  // Reports & Live Executive Metrics
  getAdminOverview() {
    return this.get('/v1/reports/admin-overview');
  }

  getDepartmentSummaries() {
    return this.get('/v1/reports/department-summaries');
  }

  getAcademicSummary() {
    return this.get('/v1/reports/academic-summary');
  }

  getAttendanceOverview() {
    return this.get('/v1/reports/attendance-overview');
  }

  getFeeCollectionSummary() {
    return this.get('/v1/reports/fee-collection');
  }

  // Departments
  getDepartments() {
    return this.get('/v1/departments');
  }

  getDepartmentById(id) {
    return this.get(`/v1/departments/${id}`);
  }

  createDepartment(data) {
    return this.post('/v1/departments', data);
  }

  updateDepartment(id, data) {
    return this.put(`/v1/departments/${id}`, data);
  }

  // Courses & Subjects
  getCourses(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.department) searchParams.append('department', params.department);
    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive);
    const qs = searchParams.toString();
    return this.get(`/v1/courses${qs ? `?${qs}` : ''}`);
  }

  getCourseById(id) {
    return this.get(`/v1/courses/${id}`);
  }

  createCourse(data) {
    return this.post('/v1/courses', data);
  }

  updateCourse(id, data) {
    return this.put(`/v1/courses/${id}`, data);
  }

  deleteCourse(id) {
    return this.delete(`/v1/courses/${id}`);
  }

  getSubjects(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.course) searchParams.append('course', params.course);
    if (params.department) searchParams.append('department', params.department);
    if (params.semester) searchParams.append('semester', params.semester);
    const qs = searchParams.toString();
    return this.get(`/v1/subjects${qs ? `?${qs}` : ''}`);
  }

  createSubject(data) {
    return this.post('/v1/subjects', data);
  }

  // Faculty
  getFaculty(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.department) searchParams.append('department', params.department);
    if (params.designation) searchParams.append('designation', params.designation);
    const qs = searchParams.toString();
    return this.get(`/v1/faculty${qs ? `?${qs}` : ''}`);
  }

  getFacultyById(id) {
    return this.get(`/v1/faculty/${id}`);
  }

  createFaculty(data) {
    return this.post('/v1/faculty', data);
  }

  updateFaculty(id, data) {
    return this.put(`/v1/faculty/${id}`, data);
  }

  // Students
  getStudents(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.department) searchParams.append('department', params.department);
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.batch) searchParams.append('batch', params.batch);
    if (params.status) searchParams.append('status', params.status);
    if (params.q) searchParams.append('q', params.q);

    const qs = searchParams.toString();
    return this.get(`/v1/students${qs ? `?${qs}` : ''}`);
  }

  getStudentById(id) {
    return this.get(`/v1/students/${id}`);
  }

  getMyStudentProfile() {
    return this.get('/v1/students/me');
  }

  createStudent(data) {
    return this.post('/v1/students', data);
  }

  updateStudent(id, data) {
    return this.put(`/v1/students/${id}`, data);
  }

  // Fees & Payments
  getFeeStructures(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.department) searchParams.append('department', params.department);
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.academicYear) searchParams.append('academicYear', params.academicYear);
    const qs = searchParams.toString();
    return this.get(`/v1/fees${qs ? `?${qs}` : ''}`);
  }

  createFeeStructure(data) {
    return this.post('/v1/fees', data);
  }

  getPayments(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.student) searchParams.append('student', params.student);
    const qs = searchParams.toString();
    return this.get(`/v1/payments${qs ? `?${qs}` : ''}`);
  }

  recordPayment(data) {
    return this.post('/v1/payments', data);
  }

  // Notices
  getNotices() {
    return this.get('/v1/notices');
  }

  createNotice(data) {
    return this.post('/v1/notices', data);
  }

  // Audit Logs
  getAuditLogs(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/audit-logs${qs ? `?${qs}` : ''}`);
  }

  // Timetable
  getTimetable(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.department) searchParams.append('department', params.department);
    if (params.course) searchParams.append('course', params.course);
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.section) searchParams.append('section', params.section);
    if (params.faculty) searchParams.append('faculty', params.faculty);
    if (params.dayOfWeek) searchParams.append('dayOfWeek', params.dayOfWeek);
    const qs = searchParams.toString();
    return this.get(`/v1/timetable${qs ? `?${qs}` : ''}`);
  }

  createTimetableSlot(data) {
    return this.post('/v1/timetable', data);
  }

  updateTimetableSlot(id, data) {
    return this.put(`/v1/timetable/${id}`, data);
  }

  deleteTimetableSlot(id) {
    return this.delete(`/v1/timetable/${id}`);
  }

  // Examinations
  getExams(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.academicYear) searchParams.append('academicYear', params.academicYear);
    if (params.department) searchParams.append('department', params.department);
    if (params.examType) searchParams.append('examType', params.examType);
    if (params.status) searchParams.append('status', params.status);
    const qs = searchParams.toString();
    return this.get(`/v1/examinations${qs ? `?${qs}` : ''}`);
  }

  getExamById(id) {
    return this.get(`/v1/examinations/${id}`);
  }

  createExam(data) {
    return this.post('/v1/examinations', data);
  }

  updateExam(id, data) {
    return this.put(`/v1/examinations/${id}`, data);
  }

  deleteExam(id) {
    return this.delete(`/v1/examinations/${id}`);
  }

  // Results
  getResults(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.examination) searchParams.append('examination', params.examination);
    if (params.student) searchParams.append('student', params.student);
    if (params.subject) searchParams.append('subject', params.subject);
    const qs = searchParams.toString();
    return this.get(`/v1/results${qs ? `?${qs}` : ''}`);
  }

  recordResult(data) {
    return this.post('/v1/results', data);
  }

  recordResultsBatch(data) {
    return this.post('/v1/results/batch', data);
  }

  // Attendance
  getAttendance(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.student) searchParams.append('student', params.student);
    if (params.subject) searchParams.append('subject', params.subject);
    if (params.date) searchParams.append('date', params.date);
    const qs = searchParams.toString();
    return this.get(`/v1/attendance${qs ? `?${qs}` : ''}`);
  }

  markAttendanceBatch(data) {
    return this.post('/v1/attendance/batch', data);
  }

  getAttendanceSummary(studentId) {
    const qs = studentId ? `?studentId=${studentId}` : '';
    return this.get(`/v1/attendance/summary${qs}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
