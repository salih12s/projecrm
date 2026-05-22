import { api } from './api';

// Karaliste servisleri
export const karalisteService = {
  // Karalisteye ekle
  add: async (data: { ad_soyad: string; cep_tel?: string; yedek_tel?: string; mahalle?: string; cadde?: string; sokak?: string; kapi_no?: string; sebep?: string }) => {
    const response = await api.post('/karaliste', data);
    return response.data;
  },

  // Karalisteden sil
  remove: async (id: number) => {
    const response = await api.delete(`/karaliste/${id}`);
    return response.data;
  },

  // Telefona göre kontrol
  checkPhone: async (phone: string): Promise<{ blacklisted: boolean; record?: any }> => {
    const response = await api.get('/karaliste/check-phone', { params: { phone } });
    return response.data;
  },

  // Adrese göre kontrol
  checkAddress: async (params: { mahalle?: string; cadde?: string; sokak?: string; kapi_no?: string }): Promise<{ blacklisted: boolean; record?: any }> => {
    const response = await api.get('/karaliste/check-address', { params });
    return response.data;
  },

  // Tüm listeyi getir
  getAll: async () => {
    const response = await api.get('/karaliste');
    return response.data;
  },
};
