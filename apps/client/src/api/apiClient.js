const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Universal API Client with automatic Authorization Bearer header injection
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.pendingRequests = new Map();
    this.lastUnauthorizedEvent = 0;
  }

  dispatchUnauthorized() {
    const now = Date.now();
    if (now - this.lastUnauthorizedEvent > 2000) {
      this.lastUnauthorizedEvent = now;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }
  }

  getToken() {
    return localStorage.getItem('college_erp_token');
  }

  isTokenExpired(token) {
    if (!token || typeof token !== 'string') return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
      const payload = JSON.parse(json);
      if (!payload.exp) return false;
      return payload.exp * 1000 < Date.now();
    } catch {
      return false;
    }
  }

  async request(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    // Deduplicate identical concurrent in-flight GET requests
    const cacheKey = method === 'GET' ? `${cleanEndpoint}:${JSON.stringify(options.headers || {})}` : null;
    if (cacheKey && this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const executeRequest = async () => {
      const token = this.getToken();

      const isPublic =
        cleanEndpoint === '/health' ||
        cleanEndpoint.endsWith('/health') ||
        cleanEndpoint.startsWith('/v1/auth/login') ||
        cleanEndpoint.startsWith('/v1/auth/register') ||
        cleanEndpoint.startsWith('/auth/login') ||
        cleanEndpoint.startsWith('/auth/register');

      if (!isPublic) {
        if (!token) {
          const error = new Error('No authentication token found. Please log in.');
          error.status = 401;
          error.code = 'NO_TOKEN';
          throw error;
        }

        if (this.isTokenExpired(token)) {
          localStorage.removeItem('college_erp_token');
          localStorage.removeItem('college_erp_user');
          this.dispatchUnauthorized();
          const error = new Error('Session expired. Please log in again.');
          error.status = 401;
          error.code = 'TOKEN_EXPIRED';
          throw error;
        }
      }

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
        if (error.status === 401 && error.code !== 'NO_TOKEN' && !cleanEndpoint.startsWith('/v1/auth/login')) {
          localStorage.removeItem('college_erp_token');
          localStorage.removeItem('college_erp_user');
          this.dispatchUnauthorized();
        }
        throw error;
      }
    };

    if (cacheKey) {
      const promise = executeRequest().finally(() => {
        this.pendingRequests.delete(cacheKey);
      });
      this.pendingRequests.set(cacheKey, promise);
      return promise;
    }

    return executeRequest();
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
    if (params.department) {
      const dept = typeof params.department === 'object' && params.department !== null
        ? (params.department._id || params.department.id || '')
        : String(params.department).trim();
      if (dept && dept !== '[object Object]') {
        searchParams.append('department', dept);
      }
    }
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
  getCourses() {
    return this.get('/v1/courses');
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
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.department) searchParams.append('department', params.department);
    const qs = searchParams.toString();
    return this.get(`/v1/subjects${qs ? `?${qs}` : ''}`);
  }

  createSubject(data) {
    return this.post('/v1/subjects', data);
  }

  updateSubject(id, data) {
    return this.put(`/v1/subjects/${id}`, data);
  }

  deleteSubject(id) {
    return this.delete(`/v1/subjects/${id}`);
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

  getMyFacultyProfile() {
    return this.get('/v1/faculty/me');
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
    if (params.department) searchParams.append('department', params.department);
    if (params.status) searchParams.append('status', params.status);
    if (params.status) searchParams.append('status', params.status);
    if (params.feeCategory) searchParams.append('feeCategory', params.feeCategory);
    const qs = searchParams.toString();
    return this.get(`/v1/fees/structures${qs ? `?${qs}` : ''}`);
  }

  getFeeStructureById(id) {
    return this.get(`/v1/fees/structures/${id}`);
  }

  createFeeStructure(data) {
    return this.post('/v1/fees/structures', data);
  }

  updateFeeStructure(id, data) {
    return this.put(`/v1/fees/structures/${id}`, data);
  }

  archiveFeeStructure(id) {
    return this.patch(`/v1/fees/structures/${id}/archive`, {});
  }

  // Invoices & Dues
  getFeeInvoices(params = {}) {
    return this.getInvoices(params);
  }

  getInvoices(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.student) searchParams.append('student', params.student);
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.academicYear) searchParams.append('academicYear', params.academicYear);
    if (params.status) searchParams.append('status', params.status);
    if (params.feeCategory) searchParams.append('feeCategory', params.feeCategory);
    const qs = searchParams.toString();
    return this.get(`/v1/fees/invoices${qs ? `?${qs}` : ''}`);
  }

  getInvoiceById(id) {
    return this.get(`/v1/fees/invoices/${id}`);
  }

  createInvoice(data) {
    return this.post('/v1/fees/invoices', data);
  }

  applyInvoiceAdjustment(id, data) {
    return this.post(`/v1/fees/invoices/${id}/adjustments`, data);
  }

  // Payments & Receipts
  getGatewayStatus() {
    return this.get('/v1/payments/gateway-status');
  }

  getPayments(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.student) searchParams.append('student', params.student);
    if (params.status) searchParams.append('status', params.status);
    if (params.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    const qs = searchParams.toString();
    return this.get(`/v1/payments${qs ? `?${qs}` : ''}`);
  }

  recordPayment(data) {
    return this.post('/v1/payments', data);
  }

  getReceipt(paymentId) {
    return this.get(`/v1/payments/${paymentId}/receipt`);
  }

  processRefund(paymentId, data) {
    return this.post(`/v1/payments/${paymentId}/refund`, data);
  }

  // Notices
  getNotices(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.category) searchParams.append('category', params.category);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.status) searchParams.append('status', params.status);
    if (params.department) searchParams.append('department', params.department);
    const qs = searchParams.toString();
    return this.get(`/v1/notices${qs ? `?${qs}` : ''}`);
  }

  getNoticeById(id) {
    return this.get(`/v1/notices/${id}`);
  }

  createNotice(data) {
    return this.post('/v1/notices', data);
  }

  updateNotice(id, data) {
    return this.put(`/v1/notices/${id}`, data);
  }

  publishNotice(id) {
    return this.patch(`/v1/notices/${id}/publish`, {});
  }

  archiveNotice(id) {
    return this.patch(`/v1/notices/${id}/archive`, {});
  }

  // Security & Audit Logs
  getAuditLogs(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.action) searchParams.append('action', params.action);
    if (params.entityType) searchParams.append('entityType', params.entityType);
    if (params.outcome) searchParams.append('outcome', params.outcome);
    if (params.actor) searchParams.append('actor', params.actor);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.q) searchParams.append('q', params.q);
    const qs = searchParams.toString();
    return this.get(`/v1/audit-logs${qs ? `?${qs}` : ''}`);
  }

  getAuditLogById(id) {
    return this.get(`/v1/audit-logs/${id}`);
  }

  // Data-backed Institutional Reports
  getEnrollmentReport(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.department) searchParams.append('department', params.department);
    if (params.course) searchParams.append('course', params.course);
    if (params.semester) searchParams.append('semester', params.semester);
    const qs = searchParams.toString();
    return this.get(`/v1/reports/enrollment${qs ? `?${qs}` : ''}`);
  }

  getFacultyAllocationReport(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.department) searchParams.append('department', params.department);
    const qs = searchParams.toString();
    return this.get(`/v1/reports/faculty-allocation${qs ? `?${qs}` : ''}`);
  }

  getAttendanceReport(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.subject) searchParams.append('subject', params.subject);
    const qs = searchParams.toString();
    return this.get(`/v1/reports/attendance${qs ? `?${qs}` : ''}`);
  }

  getExaminationsReport(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.academicYear) searchParams.append('academicYear', params.academicYear);
    if (params.semester) searchParams.append('semester', params.semester);
    const qs = searchParams.toString();
    return this.get(`/v1/reports/examinations${qs ? `?${qs}` : ''}`);
  }

  getResultsSummaryReport(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.examination) searchParams.append('examination', params.examination);
    const qs = searchParams.toString();
    return this.get(`/v1/reports/results${qs ? `?${qs}` : ''}`);
  }

  getFinancialReport(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.academicYear) searchParams.append('academicYear', params.academicYear);
    if (params.semester) searchParams.append('semester', params.semester);
    const qs = searchParams.toString();
    return this.get(`/v1/reports/financial${qs ? `?${qs}` : ''}`);
  }

  getAdminActivityReport(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    return this.get(`/v1/reports/admin-activity${qs ? `?${qs}` : ''}`);
  }

  // Timetable, Exams & Results
  getTimetable(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.department) searchParams.append('department', params.department);
    if (params.semester) searchParams.append('semester', params.semester);
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

  createExam(data) {
    return this.post('/v1/examinations', data);
  }

  updateExam(id, data) {
    return this.put(`/v1/examinations/${id}`, data);
  }

  deleteExam(id) {
    return this.delete(`/v1/examinations/${id}`);
  }

  getExams(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.academicYear) searchParams.append('academicYear', params.academicYear);
    const qs = searchParams.toString();
    return this.get(`/v1/examinations${qs ? `?${qs}` : ''}`);
  }

  recordResult(data) {
    return this.post('/v1/results', data);
  }

  batchRecordResults(data) {
    return this.post('/v1/results/batch', data);
  }

  getResults(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.examination) searchParams.append('examination', params.examination);
    if (params.student) searchParams.append('student', params.student);
    const qs = searchParams.toString();
    return this.get(`/v1/results${qs ? `?${qs}` : ''}`);
  }

  getAttendance(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.student) searchParams.append('student', params.student);
    if (params.subject) searchParams.append('subject', params.subject);
    const qs = searchParams.toString();
    return this.get(`/v1/attendance${qs ? `?${qs}` : ''}`);
  }

  markAttendanceBatch(data) {
    return this.post('/v1/attendance/mark', data);
  }

  getAttendanceSummary(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.student) searchParams.append('student', params.student);
    if (params.subject) searchParams.append('subject', params.subject);
    if (params.department) searchParams.append('department', params.department);
    if (params.departmentId) searchParams.append('departmentId', params.departmentId);
    const qs = searchParams.toString();
    return this.get(`/v1/attendance/summary${qs ? `?${qs}` : ''}`);
  }

  getAtRiskStudents(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.department) searchParams.append('department', params.department);
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.riskLevel) searchParams.append('riskLevel', params.riskLevel);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    const qs = searchParams.toString();
    return this.get(`/v1/students/at-risk${qs ? `?${qs}` : ''}`);
  }

  getStudentRiskDetails(studentId) {
    return this.get(`/v1/students/${studentId}/risk-details`);
  }

  getLeaves(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.department) searchParams.append('department', params.department);
    if (params.leaveType) searchParams.append('leaveType', params.leaveType);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/leaves${qs ? `?${qs}` : ''}`);
  }

  getLeaveById(id) {
    return this.get(`/v1/leaves/${id}`);
  }

  applyLeave(data) {
    return this.post('/v1/leaves', data);
  }

  reviewLeave(id, data) {
    return this.patch(`/v1/leaves/${id}/review`, data);
  }

  async downloadReport(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.append('type', params.type);
    if (params.format) searchParams.append('format', params.format);
    if (params.department) searchParams.append('department', params.department);
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();

    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/v1/reports/export?${qs}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Report download failed');
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    let filename = `report-${params.type || 'export'}.${params.format || 'csv'}`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return { success: true, filename };
  }

  // -------------------------------------------------------------
  // Phase 1: Institutional Management - Accreditation & Compliance
  // -------------------------------------------------------------
  getAccreditationCriteria(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.framework) searchParams.append('framework', params.framework);
    if (params.category) searchParams.append('category', params.category);
    if (params.status) searchParams.append('status', params.status);
    if (params.department) searchParams.append('department', params.department);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/accreditation${qs ? `?${qs}` : ''}`);
  }

  getAccreditationSummary() {
    return this.get('/v1/accreditation/summary');
  }

  getAccreditationCriterionById(id) {
    return this.get(`/v1/accreditation/${id}`);
  }

  createAccreditationCriterion(data) {
    return this.post('/v1/accreditation', data);
  }

  updateAccreditationCriterion(id, data) {
    return this.put(`/v1/accreditation/${id}`, data);
  }

  deleteAccreditationCriterion(id) {
    return this.delete(`/v1/accreditation/${id}`);
  }

  addCriterionEvidence(id, data) {
    return this.post(`/v1/accreditation/${id}/evidence`, data);
  }

  verifyCriterionEvidence(id, docId, data) {
    return this.patch(`/v1/accreditation/${id}/evidence/${docId}/verify`, data);
  }

  // -------------------------------------------------------------
  // Phase 1: Institutional Management - Goals & KPI Tracker
  // -------------------------------------------------------------
  getInstitutionalGoals(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.status) searchParams.append('status', params.status);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.academicYear) searchParams.append('academicYear', params.academicYear);
    if (params.semester) searchParams.append('semester', params.semester);
    if (params.department) searchParams.append('department', params.department);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/institutional-goals${qs ? `?${qs}` : ''}`);
  }

  getGoalsSummary() {
    return this.get('/v1/institutional-goals/summary');
  }

  getInstitutionalGoalById(id) {
    return this.get(`/v1/institutional-goals/${id}`);
  }

  createInstitutionalGoal(data) {
    return this.post('/v1/institutional-goals', data);
  }

  updateInstitutionalGoal(id, data) {
    return this.put(`/v1/institutional-goals/${id}`, data);
  }

  deleteInstitutionalGoal(id) {
    return this.delete(`/v1/institutional-goals/${id}`);
  }

  recordGoalProgress(id, data) {
    return this.post(`/v1/institutional-goals/${id}/progress`, data);
  }

  // -------------------------------------------------------------
  // Phase 1: Institutional Management - Deadlines & Events
  // -------------------------------------------------------------
  getInstitutionalEvents(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.status) searchParams.append('status', params.status);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.department) searchParams.append('department', params.department);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/institutional-events${qs ? `?${qs}` : ''}`);
  }

  getEventsSummary() {
    return this.get('/v1/institutional-events/summary');
  }

  getInstitutionalEventById(id) {
    return this.get(`/v1/institutional-events/${id}`);
  }

  createInstitutionalEvent(data) {
    return this.post('/v1/institutional-events', data);
  }

  updateInstitutionalEvent(id, data) {
    return this.put(`/v1/institutional-events/${id}`, data);
  }

  deleteInstitutionalEvent(id) {
    return this.delete(`/v1/institutional-events/${id}`);
  }

  markEventCompleted(id, data = {}) {
    return this.patch(`/v1/institutional-events/${id}/complete`, data);
  }

  // -------------------------------------------------------------
  // Library Management System APIs
  // -------------------------------------------------------------
  getLibraryDashboard() {
    return this.get('/v1/library/dashboard');
  }

  getBooks(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.category) searchParams.append('category', params.category);
    if (params.author) searchParams.append('author', params.author);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/library/books${qs ? `?${qs}` : ''}`);
  }

  getBookById(id) {
    return this.get(`/v1/library/books/${id}`);
  }

  createBook(data) {
    return this.post('/v1/library/books', data);
  }

  updateBook(id, data) {
    return this.put(`/v1/library/books/${id}`, data);
  }

  addBookCopies(id, data) {
    return this.post(`/v1/library/books/${id}/copies`, data);
  }

  archiveBook(id) {
    return this.delete(`/v1/library/books/${id}`);
  }

  getBookCategories() {
    return this.get('/v1/library/categories');
  }

  createBookCategory(data) {
    return this.post('/v1/library/categories', data);
  }

  getLibraryMembers(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/library/members${qs ? `?${qs}` : ''}`);
  }

  registerLibraryMember(data) {
    return this.post('/v1/library/members', data);
  }

  getLibraryMemberDetails(id) {
    return this.get(`/v1/library/members/${id}`);
  }

  issueBook(data) {
    return this.post('/v1/library/issues', data);
  }

  getCirculationIssues(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.memberId) searchParams.append('memberId', params.memberId);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/library/issues${qs ? `?${qs}` : ''}`);
  }

  returnBook(data) {
    return this.post('/v1/library/returns', data);
  }

  renewBook(data) {
    return this.post('/v1/library/renewals', data);
  }

  getBookReservations(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/library/reservations${qs ? `?${qs}` : ''}`);
  }

  createBookReservation(data) {
    return this.post('/v1/library/reservations', data);
  }

  cancelBookReservation(id) {
    return this.delete(`/v1/library/reservations/${id}`);
  }

  getLibraryFines(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.memberId) searchParams.append('memberId', params.memberId);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/library/fines${qs ? `?${qs}` : ''}`);
  }

  payLibraryFine(data) {
    return this.post('/v1/library/fines/pay', data);
  }

  waiveLibraryFine(data) {
    return this.post('/v1/library/fines/waive', data);
  }

  getDigitalResources(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.category) searchParams.append('category', params.category);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const qs = searchParams.toString();
    return this.get(`/v1/library/digital-resources${qs ? `?${qs}` : ''}`);
  }

  createDigitalResource(data) {
    return this.post('/v1/library/digital-resources', data);
  }

  recordDigitalDownload(id) {
    return this.post(`/v1/library/digital-resources/${id}/download`, {});
  }

  getLibrarySettings() {
    return this.get('/v1/library/settings');
  }

  updateLibrarySettings(data) {
    return this.put('/v1/library/settings', data);
  }

  async downloadLibraryReport(type = 'inventory') {
    const token = this.getToken();
    const url = `${this.baseUrl}/v1/library/reports?type=${encodeURIComponent(type)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to export report: ${response.statusText}`);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `library_${type}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
