import axios, { InternalAxiosRequestConfig } from 'axios';
import { Islem, IslemCreateDto, IslemUpdateDto, FilterParams } from '../types';

const API_URL = 'http://localhost:5000/api';

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

export { api };
