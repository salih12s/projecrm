import { api } from './api';
import { Bayi } from '../types';

// Bayi servisleri
export const bayiService = {
  getAll: async (): Promise<Bayi[]> => {
    const response = await api.get<Bayi[]>('/bayiler');
    return response.data;
  },

  create: async (data: { isim: string }) => {
    const response = await api.post('/bayiler', data);
    return response.data;
  },

  update: async (id: number, data: { isim: string }) => {
    const response = await api.put(`/bayiler/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/bayiler/${id}`);
  },
};
