import { api } from './api';
import { Montaj } from '../types';

// Montaj servisleri
export const montajService = {
  getAll: async (): Promise<Montaj[]> => {
    const response = await api.get<Montaj[]>('/montajlar');
    return response.data;
  },

  create: async (data: { isim: string }) => {
    const response = await api.post('/montajlar', data);
    return response.data;
  },

  update: async (id: number, data: { isim: string }) => {
    const response = await api.put(`/montajlar/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/montajlar/${id}`);
  },
};
