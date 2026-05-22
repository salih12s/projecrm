import { api } from './api';
import { Islem } from '../types';

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

  getAllRecords: async (params?: { page?: number; limit?: number }): Promise<{ data: Islem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const response = await api.get('/admin/all-records', { params });
    return response.data;
  },
};
