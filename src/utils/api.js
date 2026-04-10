import axios from 'axios';

const api = axios.create({
  baseURL: 'https://grand-spice-backend.onrender.com/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export const menuAPI = {
  getAll: () => api.get('/menu'),
  getByCategory: (cat) => api.get(`/menu/category/${encodeURIComponent(cat)}`),
};

export const orderAPI = {
  create: (payload) => api.post('/orders', payload),
  getById: (orderId) => api.get(`/orders/${encodeURIComponent(orderId)}`),
  getAll: (params) => api.get('/orders', { params }),
  updateCounterStatus: (orderId, counter, status) =>
    api.patch(`/orders/${encodeURIComponent(orderId)}/counter-status`, { counter, status }),
  confirmPayment: (orderId, paymentMethod) =>
    api.patch(`/orders/${encodeURIComponent(orderId)}/payment`, { paymentMethod }),
};

export const tableAPI = {
  getAll: () => api.get('/tables'),
  getById: (tableId) => api.get(`/tables/${tableId}`),
};

export const waiterAPI = {
  call: (payload) => api.post('/waiter', payload),
  getAll: () => api.get('/waiter'),
  updateStatus: (id, status) => api.patch(`/waiter/${id}/status`, { status }),
};

export default api;