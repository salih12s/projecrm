import axios, { InternalAxiosRequestConfig } from 'axios';
import { Islem, IslemCreateDto, IslemUpdateDto, FilterParams } from '../types';

// Environment variable'dan API URL'i al
// Development: http://localhost:5000/api
// Production: /api (aynı domain)
// Local + Production API: .env.local dosyasında override edilebilir
const API_URL = import.meta.env.VITE_API_URL || '/api';

console.log('API URL:', API_URL); // Debug için

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token'ı her istekte ekle
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Hata yönetimi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz, kullanıcıyı çıkış yap
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth servisleri
export const authService = {
  verifySystemPassword: async (password: string) => {
    const response = await api.post('/auth/verify-system-password', { password });
    return response.data;
  },

  register: async (username: string, password: string) => {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  bayiLogin: async (username: string, password: string) => {
    const response = await api.post('/auth/bayi-login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  adminLogin: async (username: string, password: string) => {
    const response = await api.post('/admin/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// İşlem servisleri
export const islemService = {
  getAll: async (filters?: FilterParams): Promise<Islem[]> => {
    const response = await api.get('/islemler', { params: filters });
    return response.data;
  },

  create: async (data: IslemCreateDto): Promise<Islem> => {
    const response = await api.post('/islemler', data);
    return response.data;
  },

  update: async (id: number, data: IslemUpdateDto): Promise<Islem> => {
    const response = await api.put(`/islemler/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/islemler/${id}`);
  },

  updateDurum: async (id: number, is_durumu: 'acik' | 'tamamlandi'): Promise<Islem> => {
    const response = await api.patch(`/islemler/${id}/durum`, { is_durumu });
    return response.data;
  },
};

// Admin servisleri
export const adminService = {
  createUser: async (username: string, password: string) => {
    const response = await api.post('/admin/create-user', { username, password });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  toggleUserStatus: async (id: number) => {
    const response = await api.patch(`/admin/users/${id}/toggle`);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getUserRecords: async (username: string) => {
    const response = await api.get(`/admin/user-records/${username}`);
    return response.data;
  },

  getUserAtolyeRecords: async (username: string) => {
    const response = await api.get(`/admin/user-atolye-records/${username}`);
    return response.data;
  },

  getAllRecords: async (): Promise<Islem[]> => {
    const response = await api.get('/admin/all-records');
    return response.data;
  },
};

export { api };
