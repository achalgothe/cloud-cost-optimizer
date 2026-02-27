import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
};

export const costService = {
  getOverview: async (params = {}) => {
    const response = await api.get('/costs/overview', { params });
    return response.data;
  },

  getBreakdown: async (params = {}) => {
    const response = await api.get('/costs/breakdown', { params });
    return response.data;
  },

  getForecast: async (params = {}) => {
    const response = await api.get('/costs/forecast', { params });
    return response.data;
  },
};

export const recommendationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/recommendations', { params });
    return response.data;
  },

  generate: async (provider) => {
    const response = await api.post('/recommendations/generate', { provider });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/recommendations/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/recommendations/${id}`);
    return response.data;
  },
};

export const resourceService = {
  getAll: async (params = {}) => {
    const response = await api.get('/resources', { params });
    return response.data;
  },

  scan: async (provider, resources) => {
    const response = await api.post('/resources/scan', { provider, resources });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/resources', data);
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/resources/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },
};

export const budgetService = {
  getAll: async (params = {}) => {
    const response = await api.get('/budgets', { params });
    return response.data.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/budgets/${id}`);
    return response.data.data;
  },

  create: async (data) => {
    const response = await api.post('/budgets', data);
    return response.data.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};
