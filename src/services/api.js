import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added auth token to request');
    } else {
      console.log('No auth token found');
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', error);
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('401 Unauthorized - clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect in React app - let the component handle it
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/update', userData),
  uploadProfilePicture: (formData) => 
    api.post('/users/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  searchUsers: (query) => {
    console.log('API: searchUsers called with query:', query);
    console.log('API: Full URL:', `/users/all?search=${query}`);
    return api.get(`/users/all?search=${query}`).catch(err => {
      console.error('API: searchUsers failed:', err);
      throw err;
    });
  },
  getUserById: (userId) => api.get(`/users/${userId}`),
  getOnlineUsers: () => api.get('/users/online'),
  updateStatus: (status) => api.put('/users/status', { status }),
  getContacts: () => api.get('/users/contacts'),
  addContact: (userId) => api.post('/users/contacts', { userId }),
  removeContact: (userId) => api.delete(`/users/contacts/${userId}`),
  blockUser: (userId) => api.post(`/users/block/${userId}`),
  unblockUser: (userId) => api.delete(`/users/block/${userId}`)
};

// Chat API
export const chatAPI = {
  getChats: (page = 1, search = '') => {
    console.log('API: Getting chats, page:', page, 'search:', search);
    return api.get(`/chats?page=${page}&search=${search}`).catch(err => {
      console.error('API: getChats failed:', err);
      throw err;
    });
  },
  getChat: (chatId) => api.get(`/chats/${chatId}`),
  createChat: (participantIds) => api.post('/chats/create', { participantIds }),
  createGroupChat: (chatData) => api.post('/chats/create', chatData),
  updateChat: (chatId, chatData) => api.put(`/chats/${chatId}`, chatData),
  deleteChat: (chatId) => api.delete(`/chats/${chatId}`),
  addParticipant: (chatId, userId) => api.post(`/chats/${chatId}/participants`, { userId }),
  removeParticipant: (chatId, userId) => api.delete(`/chats/${chatId}/participants/${userId}`),
  leaveChat: (chatId) => api.post(`/chats/${chatId}/leave`),
  archiveChat: (chatId) => api.post(`/chats/${chatId}/archive`),
  unarchiveChat: (chatId) => api.post(`/chats/${chatId}/unarchive`)
};

// Message API
export const messageAPI = {
  getMessages: (chatId, page = 1, before = null) => {
    let url = `/messages/${chatId}?page=${page}`;
    if (before) url += `&before=${before}`;
    return api.get(url);
  },
  sendMessage: (chatId, messageData) => api.post(`/messages/${chatId}`, messageData),
  editMessage: (messageId, content) => api.put(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  markAsRead: (chatId, messageIds) => api.post(`/messages/${chatId}/read`, { messageIds }),
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji }),
  removeReaction: (messageId, emoji) => api.delete(`/messages/${messageId}/react/${emoji}`),
  searchMessages: (chatId, query) => api.get(`/messages/${chatId}/search?q=${query}`),
  uploadFile: (chatId, formData) => api.post(`/messages/${chatId}/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default api;
