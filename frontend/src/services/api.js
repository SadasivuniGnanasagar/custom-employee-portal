const API_URL = '/api';

const getToken = () => localStorage.getItem('token');

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // FIXED: This now shows the exact URL being requested
  console.log("The login URL is:", `${API_URL}${endpoint}`);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      //localStorage.removeItem('token');
      //localStorage.removeItem('user');
      //window.location.href = '/login';
    }
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

export const auth = {
  login: (email, password) =>
    apiRequest('/login', { 
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => {
    // Send the email in a custom header so the backend knows who it is
    const email = JSON.parse(localStorage.getItem('user'))?.email;
    return apiRequest('/auth/me', {
      headers: { 'x-user-email': email }
    });
  },
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

export const users = {
  getAll: () => apiRequest('/users'),
  updateStatus: (id, status) =>
    apiRequest(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  update: (id, data) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' }),
  getRoles: () => apiRequest('/users/roles'),
  getAuditLogs: (params = {}) =>
    apiRequest(`/users/audit-logs?${new URLSearchParams(params)}`),
};

export const zoho = {
  getApps: () => apiRequest('/zoho/apps'),
  getTransactions: () => apiRequest('/zoho/transactions'),
  getSales: (period) => apiRequest(`/zoho/sales?period=${period}`), 
  getTickets: () => apiRequest('/zoho/tickets'), 
  updateTicketStatus: (id, status) => // <--- Add this line
    apiRequest(`/zoho/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  proxy: (app, endpoint, method = 'GET', data = null, query = {}) => {
    const queryString = new URLSearchParams({ method, ...query }).toString();
    return apiRequest(`/zoho/proxy/${app}/${endpoint}?${queryString}`, {
      method: method === 'GET' ? 'GET' : 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
};