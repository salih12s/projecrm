import { api } from './api';
import { Aksesuar } from '../types';

// Aksesuar servisleri
export const aksesuarService = {
  getAll: async (): Promise<Aksesuar[]> => {
    const response = await api.get<Aksesuar[]>('/aksesuarlar');
    return response.data;
  },

  create: async (data: { isim: string }) => {
    const response = await api.post('/aksesuarlar', data);
    return response.data;
  },

  update: async (id: number, data: { isim: string }) => {
    const response = await api.put(`/aksesuarlar/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/aksesuarlar/${id}`);
  },
};
