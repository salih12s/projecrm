import { api } from './api';
import { Teknisyen } from '../types';

// Teknisyen servisleri
export const teknisyenService = {
  getAll: async (): Promise<Teknisyen[]> => {
    const response = await api.get<Teknisyen[]>('/teknisyenler');
    return response.data;
  },

  create: async (data: { isim: string }) => {
    const response = await api.post('/teknisyenler', data);
    return response.data;
  },

  update: async (id: number, data: { isim: string }) => {
    const response = await api.put(`/teknisyenler/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teknisyenler/${id}`);
  },
};
