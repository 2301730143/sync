import api from './api';

export const projectService = {
  list: () => api.get('/projects'),
  create: (payload) => api.post('/projects', payload),
  get: (id) => api.get(`/projects/${id}`),
  overview: (id) => api.get(`/projects/${id}/overview`),
  update: (id, payload) => api.put(`/projects/${id}`, payload),
  remove: (id) => api.delete(`/projects/${id}`),

  listMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, payload) => api.post(`/projects/${id}/members`, payload),
  updateMember: (id, memberId, payload) => api.put(`/projects/${id}/members/${memberId}`, payload),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),

  listConversations: (id) => api.get(`/projects/${id}/conversations`),
  importConversation: (id, payload) => api.post(`/projects/${id}/conversations`, payload),

  analyze: (id, conversationId) => api.post(`/projects/${id}/analyze`, { conversationId }),
  confirmAnalysis: (id, analysisId, payload) => api.post(`/projects/${id}/analysis/${analysisId}/confirm`, payload),
  discardAnalysis: (id, analysisId) => api.post(`/projects/${id}/analysis/${analysisId}/discard`),

  listTasks: (id) => api.get(`/projects/${id}/tasks`),
  createTask: (id, payload) => api.post(`/projects/${id}/tasks`, payload),

  listInsights: (id) => api.get(`/projects/${id}/insights`),
  generateInsights: (id) => api.post(`/projects/${id}/insights/generate`),
  workloadAnalysis: (id) => api.get(`/projects/${id}/workload-analysis`),
};

export const taskService = {
  update: (id, payload) => api.put(`/tasks/${id}`, payload),
  remove: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
};

export const notificationService = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};
