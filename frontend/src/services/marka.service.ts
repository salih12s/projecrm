import { api } from './api';
import { Marka } from '../types';

// Marka servisleri
export const markaService = {
  getAll: async (): Promise<Marka[]> => {
    const response = await api.get<Marka[]>('/markalar');
    return response.data;
  },

  create: async (data: { isim: string }) => {
    const response = await api.post('/markalar', data);
    return response.data;
  },

  update: async (id: number, data: { isim: string }) => {
    const response = await api.put(`/markalar/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/markalar/${id}`);
  },
};
