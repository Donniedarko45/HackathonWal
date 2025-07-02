import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Any request interceptor logic here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't redirect on 401 for auth/me calls - just let them fail silently
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/me')) {
      // Only redirect to login for non-auth-check 401s
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: {
    email: string;
    name: string;
    password: string;
    role?: string;
  }) => api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
};

// Inventory API
export const inventoryApi = {
  getAll: (params?: any) => api.get('/inventory', { params }),
  getById: (id: string) => api.get(`/inventory/${id}`),
  create: (data: any) => api.post('/inventory', data),
  update: (id: string, data: any) => api.put(`/inventory/${id}`, data),
  adjustStock: (id: string, adjustment: number, reason: string) =>
    api.post(`/inventory/${id}/adjust`, { adjustment, reason }),
  getLowStock: (locationId?: string) =>
    api.get('/inventory/alerts/low-stock', {
      params: locationId ? { locationId } : {},
    }),
  delete: (id: string) => api.delete(`/inventory/${id}`),
};

// Orders API
export const ordersApi = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  fulfill: (id: string) => api.post(`/orders/${id}/fulfill`),
  cancel: (id: string, reason: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
  getAnalytics: (params?: any) =>
    api.get('/orders/analytics/summary', { params }),
};

// Delivery API
export const deliveryApi = {
  getAll: (params?: any) => api.get('/delivery', { params }),
  getById: (id: string) => api.get(`/delivery/${id}`),
  create: (data: any) => api.post('/delivery', data),
  update: (id: string, data: any) => api.put(`/delivery/${id}`, data),
  assignDriver: (id: string, driverId: string) =>
    api.post(`/delivery/${id}/assign-driver`, { driverId }),
  updateLocation: (id: string, latitude: number, longitude: number) =>
    api.post(`/delivery/${id}/location`, { latitude, longitude }),
  optimizeRoute: (deliveryIds: string[], driverId?: string) =>
    api.post('/delivery/optimize-route', { deliveryIds, driverId }),
  getDriverDeliveries: (driverId: string) =>
    api.get(`/delivery/driver/${driverId}/today`),
  getAnalytics: (params?: any) =>
    api.get('/delivery/analytics/performance', { params }),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: any) => api.get('/suppliers', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  getPerformance: (id: string, params?: any) =>
    api.get(`/suppliers/${id}/performance`, { params }),
  updateRating: (id: string, rating: number, orderId?: string) =>
    api.post(`/suppliers/${id}/rating`, { rating, orderId }),
  getTopPerformers: (params?: any) =>
    api.get('/suppliers/analytics/top-performers', { params }),
  deactivate: (id: string, reason: string) =>
    api.post(`/suppliers/${id}/deactivate`, { reason }),
};

// Locations API
export const locationsApi = {
  getAll: (params?: any) => api.get('/locations', { params }),
  getById: (id: string) => api.get(`/locations/${id}`),
  create: (data: any) => api.post('/locations', data),
  update: (id: string, data: any) => api.put(`/locations/${id}`, data),
  getInventorySummary: (id: string) =>
    api.get(`/locations/${id}/inventory-summary`),
  getAnalytics: (id: string, params?: any) =>
    api.get(`/locations/${id}/analytics`, { params }),
  getNearby: (id: string, radius?: number) =>
    api.get(`/locations/${id}/nearby`, {
      params: radius ? { radius } : {},
    }),
  getByType: (type: string) => api.get(`/locations/type/${type}`),
};

// Analytics API
export const analyticsApi = {
  getDashboard: (params?: any) =>
    api.get('/analytics/dashboard', { params }),
  getKPIs: (params?: any) => api.get('/analytics/kpis', { params }),
  getTrends: (params?: any) => api.get('/analytics/trends', { params }),
  getBenchmarks: (params?: any) =>
    api.get('/analytics/benchmarks', { params }),
  getInventoryAnalytics: (params?: any) =>
    api.get('/analytics/inventory', { params }),
};

export default api; 