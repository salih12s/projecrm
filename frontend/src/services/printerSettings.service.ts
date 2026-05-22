import { api } from './api';

// Yazıcı ayarları (layout config) servisleri.
// Layout şekli: { id, label, position: {x, y}, isStatic? }[]
// Component bu yapıyı kendisi tip'liyor; service tarafından opak tutuyoruz.
export const printerSettingsService = {
  // Marka için kayıtlı layout'u getir. Yoksa backend boş/null döndürebilir.
  get: async (marka: string): Promise<any> => {
    const response = await api.get(`/printer-settings/${marka}`);
    return response.data;
  },

  // Marka için layout kaydet/güncelle
  save: async (marka: string, layoutConfig: any): Promise<any> => {
    const response = await api.post(`/printer-settings/${marka}`, layoutConfig);
    return response.data;
  },

  // Marka için kayıtlı layout'u sil (varsayılana sıfırla)
  delete: async (marka: string): Promise<void> => {
    await api.delete(`/printer-settings/${marka}`);
  },
};
