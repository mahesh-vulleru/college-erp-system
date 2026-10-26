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
        // Clear expired session and dispatch event for AuthContext
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

  // Protected User Management endpoints (Super Admin)
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
}

export const api = new ApiClient(API_BASE_URL);
export default api;
