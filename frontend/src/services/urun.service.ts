import { api } from './api';
import { Urun } from '../types';

// Ürün servisleri
export const urunService = {
  getAll: async (): Promise<Urun[]> => {
    const response = await api.get<Urun[]>('/urunler');
    return response.data;
  },

  create: async (data: { isim: string }) => {
    const response = await api.post('/urunler', data);
    return response.data;
  },

  update: async (id: number, data: { isim: string }) => {
    const response = await api.put(`/urunler/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/urunler/${id}`);
  },
};
