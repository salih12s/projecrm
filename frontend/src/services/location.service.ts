import { api } from './api';

// Lokasyon (ilçe / mahalle) servisleri
export interface Ilce {
  ilce_id: number;
  isim: string;
}

export interface Mahalle {
  mahalle_id: number;
  isim: string;
}

export const locationService = {
  getIlceler: async (): Promise<Ilce[]> => {
    const response = await api.get<Ilce[]>('/ilceler');
    return response.data;
  },

  getMahalleler: async (ilceId: number): Promise<Mahalle[]> => {
    const response = await api.get<Mahalle[]>(`/ilceler/${ilceId}/mahalleler`);
    return response.data;
  },
};
