import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('scms_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('scms_token')
      localStorage.removeItem('scms_user')
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
}

// ─── Student ──────────────────────────────────────────────────────────────────
export const studentAPI = {
  myComplaints: () => api.get('/complaints/my'),
}

// ─── Complaints ───────────────────────────────────────────────────────────────
export const complaintsAPI = {
  aiPreview: (text) => api.post('/complaints/ai-preview', { text }),
  checkSimilar: (text, category, location_block) =>
    api.post('/complaints/check-similar', { text, category, location_block }),
  submit: (formData) => api.post('/complaints/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  track: (complaintId) => api.get(`/complaints/track/${complaintId}`),
  list: (params) => api.get('/complaints/', { params }),
  upvote: (id) => api.post(`/complaints/${id}/upvote`),
  feedback: (id, data) => api.post(`/complaints/${id}/feedback`, data),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  listComplaints: (params) => api.get('/admin/complaints', { params }),
  getComplaint: (id) => api.get(`/admin/complaints/${id}`),
  updateComplaint: (id, data) => api.patch(`/admin/complaints/${id}`, data),
  mergeComplaints: (sourceId, targetId) =>
    api.post('/admin/complaints/merge', { source_id: sourceId, target_id: targetId }),
  getSimilar: (id) => api.get(`/admin/similar/${id}`),
  stats: () => api.get('/admin/stats'),
  departments: () => api.get('/admin/departments'),
  semanticSearch: (query) => api.get('/admin/semantic-search', { params: { query } }),
  getRCA: (id) => api.get(`/admin/complaints/${id}/rca`),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  byCategory: () => api.get('/analytics/by-category'),
  byStatus: () => api.get('/analytics/by-status'),
  byPriority: () => api.get('/analytics/by-priority'),
  trend: (days = 30) => api.get('/analytics/trend', { params: { days } }),
  byLocation: () => api.get('/analytics/by-location'),
  insights: () => api.get('/analytics/insights'),
  recurringAlerts: () => api.get('/analytics/recurring-alerts'),
}
